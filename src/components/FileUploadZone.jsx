/**
 * iOS Safari ignores programmatic .click() on display:none file inputs.
 * A visible-area <label> with an opacity-0 overlay input is a real user gesture.
 */
export default function FileUploadZone({
  accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/*',
  multiple = false,
  onFiles,
  children,
  className = 'image-upload-dropzone',
}) {
  return (
    <label className={className}>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="ios-file-input"
        onChange={async (e) => {
          const files = [...(e.target.files || [])];
          e.target.value = '';
          if (files.length) await onFiles(files);
        }}
      />
      {children}
    </label>
  );
}
