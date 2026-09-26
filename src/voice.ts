import type { Appointment, Turn } from './data'

type VoiceEvents = {
  onStatus: (status: 'connecting' | 'listening' | 'speaking' | 'ended') => void
  onTurn: (turn: Turn) => void
  onError: (message: string) => void
}

export class VoiceSession {
  private events: VoiceEvents
  private ws?: WebSocket
  private stream?: MediaStream
  private input?: AudioContext
  private output?: AudioContext
  private source?: MediaStreamAudioSourceNode
  private worklet?: AudioWorkletNode
  private playbackTime = 0
  private finished = false
  private endTimer?: number

  constructor(events: VoiceEvents) { this.events = events }

  async start(appointment: Appointment) {
    this.events.onStatus('connecting')
    try {
      // Start audio under the user's click gesture; use the device rate for echo cancellation.
      this.input = new AudioContext()
      this.output = new AudioContext()
      await Promise.all([
        this.input.audioWorklet.addModule(`${import.meta.env.BASE_URL}pcm-processor.js`),
        this.input.resume(),
        this.output.resume(),
      ])
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false },
      })
      this.source = this.input.createMediaStreamSource(this.stream)
      this.worklet = new AudioWorkletNode(this.input, 'groomnote-pcm', {
        processorOptions: { inputSampleRate: this.input.sampleRate, targetSampleRate: 24000 },
      })
      this.worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (this.ws?.readyState !== WebSocket.OPEN || this.finished) return
        const bytes = new Uint8Array(event.data)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
        this.ws.send(JSON.stringify({ type: 'input.audio', audio: btoa(binary) }))
      }
      this.source.connect(this.worklet)
      // A silent output keeps the worklet processing without feeding mic audio to speakers.
      const silent = this.input.createGain()
      silent.gain.value = 0
      this.worklet.connect(silent).connect(this.input.destination)

      const response = await fetch('/api/voice-token', { method: 'POST' })
      const payload = await response.json() as { token?: string; error?: string }
      if (!response.ok || !payload.token) throw new Error(payload.error ?? 'Voice service is unavailable.')
      if (this.finished) return
      const url = new URL('wss://agents.assemblyai.com/v1/ws')
      url.searchParams.set('token', payload.token)
      this.ws = new WebSocket(url)
      this.ws.onopen = () => {
        this.ws?.send(JSON.stringify({
          type: 'session.update',
          session: {
            system_prompt: [
              'You help a pet groomer document a completed appointment in English.',
              'Keep responses to one brief sentence. Ask at most two useful follow-up questions.',
              'Never assume historical profile notes happened today. Never diagnose or invent facts.',
              'Ask for directly observed behavior and what handling adjustment helped when relevant.',
              'Once enough information is supplied, tell the groomer to end the conversation and review the draft.',
              `Selected appointment: ${appointment.pet}, ${appointment.breed}; scheduled service: ${appointment.service}.`,
              `Historical context only: ${appointment.history}`,
            ].join(' '),
            greeting: `Let's make a note for ${appointment.pet}. What happened during the appointment?`,
            output: { voice: 'ivy' },
          },
        }))
      }
      this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data))
      this.ws.onerror = () => this.events.onError('Voice connection failed. You can still use the text preview.')
      this.ws.onclose = () => {
        if (!this.finished) this.events.onError('Voice connection closed. Your visible transcript remains available.')
        void this.cleanup()
      }
      window.addEventListener('pagehide', this.pagehide)
    } catch (error) {
      await this.cleanup()
      this.events.onError(error instanceof Error ? error.message : 'Could not start the microphone.')
    }
  }

  private handleMessage(message: Record<string, unknown>) {
    if (message.type === 'session.ready') this.events.onStatus('listening')
    if (message.type === 'reply.started') this.events.onStatus('speaking')
    if (message.type === 'reply.done') {
      this.events.onStatus('listening')
      if (message.status === 'interrupted') this.playbackTime = this.output?.currentTime ?? 0
    }
    if (message.type === 'transcript.user' || message.type === 'transcript.agent') {
      const text = typeof message.text === 'string' ? message.text.trim() : ''
      if (text) this.events.onTurn({
        id: crypto.randomUUID(),
        role: message.type === 'transcript.user' ? 'groomer' : 'assistant',
        text,
      })
    }
    if (message.type === 'reply.audio' && typeof message.data === 'string') this.play(message.data)
    if (message.type === 'session.error') this.events.onError(String(message.message ?? 'Voice service error.'))
    if (message.type === 'session.ended') void this.cleanup()
  }

  private play(encoded: string) {
    const ctx = this.output
    if (!ctx) return
    const raw = atob(encoded)
    const samples = new Float32Array(Math.floor(raw.length / 2))
    for (let i = 0; i < samples.length; i++) {
      const value = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8)
      samples[i] = (value << 16 >> 16) / 32768
    }
    const buffer = ctx.createBuffer(1, samples.length, 24000)
    buffer.getChannelData(0).set(samples)
    const node = ctx.createBufferSource()
    node.buffer = buffer
    node.connect(ctx.destination)
    this.playbackTime = Math.max(this.playbackTime, ctx.currentTime)
    node.start(this.playbackTime)
    this.playbackTime += buffer.duration
  }

  private pagehide = () => {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'session.end' }))
  }

  async end() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'session.end' }))
      this.endTimer = window.setTimeout(() => void this.cleanup(), 1500)
    } else {
      await this.cleanup()
    }
  }

  private async cleanup() {
    if (this.finished) return
    this.finished = true
    if (this.endTimer) window.clearTimeout(this.endTimer)
    window.removeEventListener('pagehide', this.pagehide)
    this.ws?.close()
    this.stream?.getTracks().forEach((track) => track.stop())
    this.source?.disconnect()
    this.worklet?.disconnect()
    await Promise.allSettled([this.input?.close(), this.output?.close()])
    this.events.onStatus('ended')
  }
}
