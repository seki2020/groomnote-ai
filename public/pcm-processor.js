class GroomNotePCM extends AudioWorkletProcessor {
  constructor(options) {
    super()
    const { inputSampleRate, targetSampleRate } = options.processorOptions
    this.ratio = inputSampleRate / targetSampleRate
    this.pending = new Float32Array(0)
  }
  process(inputs) {
    const input = inputs[0]?.[0]
    if (!input) return true
    const joined = new Float32Array(this.pending.length + input.length)
    joined.set(this.pending)
    joined.set(input, this.pending.length)
    const count = Math.floor(joined.length / this.ratio)
    if (count > 0) {
      const pcm = new Int16Array(count)
      for (let i = 0; i < count; i++) {
        const sample = joined[Math.floor(i * this.ratio)] ?? 0
        pcm[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)))
      }
      this.port.postMessage(pcm.buffer, [pcm.buffer])
    }
    this.pending = joined.slice(Math.floor(count * this.ratio))
    return true
  }
}
registerProcessor('groomnote-pcm', GroomNotePCM)
