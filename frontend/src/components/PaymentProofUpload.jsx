import { useState, useRef } from 'react'
import api from '../lib/api'

export default function PaymentProofUpload({ rfqId, rejectionNote, existingProof, onUploaded }) {
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const ACCEPTED = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB

  function handleFile(f) {
    setError('')
    if (!ACCEPTED.includes(f.type)) { setError('Only JPEG, PNG, and PDF files are accepted.'); return }
    if (f.size > MAX_SIZE) { setError('File must be under 10MB.'); return }
    setFile(f)
  }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setError('Please select a file.'); return }
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      await api.post(`/customer/rfqs/${rfqId}/payment-proof`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setFile(null)
      onUploaded()
    } catch (err) {
      const code = err?.response?.data?.error
      setError(
        code === 'FILE_TOO_LARGE'    ? 'File exceeds 10MB limit.' :
        code === 'INVALID_FILE_TYPE' ? 'Only JPEG, PNG, and PDF files are accepted.' :
        'Upload failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Rejection note */}
      {rejectionNote && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <span className="material-symbols-outlined text-red-500 text-xl flex-shrink-0 mt-0.5">error</span>
          <div>
            <p className="text-sm font-semibold text-red-700">Payment proof rejected</p>
            <p className="text-sm text-red-600 mt-0.5">{rejectionNote}</p>
            <p className="text-xs text-red-500 mt-1">Please upload a corrected proof below.</p>
          </div>
        </div>
      )}

      {/* Existing proof */}
      {existingProof && !rejectionNote && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="material-symbols-outlined text-amber-600 text-xl">upload_file</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 truncate">{existingProof.file_name}</p>
            <p className="text-xs text-amber-600">Under review — you can replace it below</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver ? 'border-primary bg-primary/5' :
            file     ? 'border-green-400 bg-green-50' :
                       'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-green-700 truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-green-600">{(file.size / 1024).toFixed(0)} KB — ready to upload</p>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                className="ml-2 text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined text-3xl text-gray-400 mb-2 block">cloud_upload</span>
              <p className="text-sm font-semibold text-gray-700">Drop your payment proof here</p>
              <p className="text-xs text-gray-500 mt-1">or click to browse — JPEG, PNG, PDF up to 10MB</p>
            </>
          )}
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full btn-primary justify-center disabled:opacity-50"
        >
          {loading ? (
            <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span> Uploading...</>
          ) : (
            <><span className="material-symbols-outlined text-base">upload</span> Submit Payment Proof</>
          )}
        </button>
      </form>
    </div>
  )
}
