async function readResponse(response) {
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || `Local development API failed (${response.status}).`)
  return result
}

  export function encodeAudioUrl(value) {
    if (!value || /^(?:https?:|blob:|data:)/i.test(value)) return value
    const [pathname, ...queryParts] = value.split('?')
    const encodedPath = pathname.split('/').map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment))
      } catch {
        return encodeURIComponent(segment)
      }
    }).join('/')
    return queryParts.length ? `${encodedPath}?${queryParts.join('?')}` : encodedPath
  }

export async function listAudioFiles() {
  return readResponse(await fetch('/__local_api/audio-files'))
}

export async function writeLessonToDisk(kind, data) {
  return readResponse(await fetch('/__local_api/save-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, data }),
  }))
}

export async function replaceLessonOnDisk(kind, oldId, data) {
  return readResponse(await fetch('/__local_api/replace-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, oldId, data }),
  }))
}

export async function deleteLessonFromDisk(kind, id) {
  return readResponse(await fetch('/__local_api/delete-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, id }),
  }))
}

export async function deleteSpeakingSetFromDisk(id, setId) {
  return readResponse(await fetch('/__local_api/delete-speaking-set', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, setId }),
  }))
}

export async function deleteAudioFromDisk(name) {
  return readResponse(await fetch('/__local_api/delete-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }))
}

export async function uploadAudioToDisk(file) {
  const filename = encodeURIComponent(file.name)
  return readResponse(await fetch(`/__local_api/upload-audio?filename=${filename}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  }))
}

export async function uploadMapImageToDisk(file) {
  const filename = encodeURIComponent(file.name)
  return readResponse(await fetch(`/__local_api/upload-map-image?filename=${filename}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  }))
}

export async function deleteMapImageFromDisk(url) {
  return readResponse(await fetch('/__local_api/delete-map-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }))
}

export async function uploadSpeakingImageToDisk(file) {
  const filename = encodeURIComponent(file.name)
  return readResponse(await fetch(`/__local_api/upload-speaking-image?filename=${filename}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  }))
}
