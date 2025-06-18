const v8 = require('v8');

const memoryUsage = {

    getObjV8Size(obj) {
        try {
            return v8.serialize(obj).length;
        } catch (error) {
            // Handle circular references or large objects
            console.log('V8 serialization failed:', error.message);
            return null;
        }
    },

    formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB']
        let size = bytes
        let unitIndex = 0
        
        while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`
    },

    getMemoryUsage(obj, isTrie = false) {
    const processMemory = process.memoryUsage()

    const trieSize = isTrie ? this.getObjV8Size(obj.root) : 0
    const semanticSetsSize = isTrie? 0 : this.getObjV8Size(obj.semanticSets)
    const termMappingsSize = this.getObjV8Size(obj.termMappings)
    const termToTextIndicesSize = this.getObjV8Size(obj.termToTextIndices)
    const dataSize = this.getObjV8Size(obj.data)

    const totalApproximateSize = trieSize + termMappingsSize + termToTextIndicesSize + semanticSetsSize + dataSize


    console.log(
      {
        processMemory: {
        rss: this.formatBytes(processMemory.rss),
        heapTotal: this.formatBytes(processMemory.heapTotal),
        heapUsed: this.formatBytes(processMemory.heapUsed),
        external: this.formatBytes(processMemory.external)
      },
      trieStructure: {
        trieSize: this.formatBytes(trieSize),
        semanticSetsSize: this.formatBytes(semanticSetsSize),
        termMappingsSize: this.formatBytes(termMappingsSize),
        termToTextIndicesSize: this.formatBytes(termToTextIndicesSize),
        dataSize: this.formatBytes(dataSize)
      },
      totalApproximateSize: this.formatBytes(totalApproximateSize)
    })
  }
}

module.exports = memoryUsage;