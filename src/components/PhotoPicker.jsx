import FileUploadZone from './FileUploadZone';
import { PHOTO_ACCEPT } from '../lib/image';

export default function PhotoPicker({
  value,
  onChange,
  onPickFile,
  busy = false,
  hint = 'Take a photo, pick from the phone gallery, choose a computer file, or paste a URL. iPhone, Android, Samsung and computer photos all work.',
}) {
  return (
    <div className="photo-picker">
      {value ? (
        <div className="photo-picker-preview">
          <img src={value} alt="Product preview" referrerPolicy="no-referrer" />
          <button
            type="button"
            className="text-btn"
            onClick={() => onChange('')}
            disabled={busy}
          >
            Remove photo
          </button>
        </div>
      ) : (
        <div className="photo-picker-empty">Photo will appear here</div>
      )}
      <div className="photo-picker-actions">
        <FileUploadZone
          className="outline-gold-btn ios-file-btn"
          accept={PHOTO_ACCEPT}
          capture="environment"
          onFiles={(files) => onPickFile(files[0])}
        >
          {busy ? 'Saving…' : 'Take photo'}
        </FileUploadZone>
        <FileUploadZone
          className="outline-gold-btn ios-file-btn"
          accept={PHOTO_ACCEPT}
          onFiles={(files) => onPickFile(files[0])}
        >
          {busy ? 'Saving…' : 'Gallery / computer'}
        </FileUploadZone>
      </div>
      <label className="photo-picker-url">
        Or paste image URL
        <input
          value={value?.startsWith('data:') ? '' : (value || '')}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder="https://…"
          inputMode="url"
          disabled={busy}
        />
      </label>
      <p className="muted photo-picker-hint">{hint}</p>
    </div>
  );
}
