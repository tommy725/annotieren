import Reflux from 'reflux'

export let actions = Reflux.createActions({
  createAnnotation: { asyncResult: true },
  updateAnnotation: { asyncResult: true },
  removeAnnotation: { asyncResult: true }
})

export default Reflux.createStore({
  listenables: actions,

  init: function() {
    this.pending = false
    this.queue = []
  },

  onCreateAnnotation: function(fileId, annotation) {
    if (this.pending) {
      this.queue.push(() => actions.createAnnotation(fileId, annotation))
      return
    }
    this.pending = true

    console.log("onCreate", annotation)

    fetch(`/api/file/${fileId}/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annotation)
    })
      .then(res => {
        if (res.status < 200 || res.status >= 300) {
          throw new Error(`HTTP status ${res.status} ${res.statusText}`)
        }

        return res
      })
      .then(res => res.json())
      .then(json => {
        console.log("addAnnotation response:", json)
        actions.createAnnotation.completed(json.id)
      })
      .catch(actions.createAnnotation.failed)
  },

  onCreateAnnotationCompleted: oneDone,
  onCreateAnnotationFailed: oneDone,

  onUpdateAnnotation: function(fileId, annotation) {
    if (this.pending) {
      this.queue.push(() => actions.updateAnnotation(fileId, annotation))
      return
    }
    this.pending = true

    console.log("onUpdate", annotation)
    
    fetch(`/api/file/${fileId}/annotations/${annotation.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annotation)
    })
      .then(res => {
        if (res.status < 200 || res.status >= 300) {
          throw new Error(`HTTP status ${res.status} ${res.statusText}`)
        }

        return res
      })
      .then(res => {
        actions.updateAnnotation.completed()
      })
      .catch(actions.updateAnnotation.failed)
  },

  onUpdateAnnotationCompleted: oneDone,
  onUpdateAnnotationFailed: oneDone,

  onRemoveAnnotation: function(fileId, annotation) {
    if (this.pending) {
      this.queue.push(() => actions.removeAnnotation(fileId, annotation))
      return
    }
    this.pending = true

    console.log("onRemove", annotation)
    
    fetch(`/api/file/${fileId}/annotations/${annotation.id}`, {
      method: 'DELETE'
    })
      .then(res => {
        if (res.status < 200 || res.status >= 300) {
          throw new Error(`HTTP status ${res.status} ${res.statusText}`)
        }

        return res
      })
      .then(res => {
        actions.removeAnnotation.completed()
      })
      .catch(actions.removeAnnotation.failed)
  },

  onRemoveAnnotationCompleted: oneDone,
  onRemoveAnnotationFailed: oneDone
})

function oneDone() {
  this.pending = false

  let next = this.queue.shift()
  next && next()
}
