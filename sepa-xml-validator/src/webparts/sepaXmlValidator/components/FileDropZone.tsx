import * as React from 'react';

interface IFileDropZoneProps {
  onFileSelected: (file: File) => void;
}

export const FileDropZone: React.FC<IFileDropZoneProps> = ({ onFileSelected }) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFile = (file?: File): void => {
    if (file && file.name.toLowerCase().endsWith('.xml')) {
      onFileSelected(file);
    }
  };

  return (
    <div
      style={{ border: '2px dashed #666', borderRadius: 8, padding: 24, textAlign: 'center', cursor: 'pointer' }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xml"
        hidden
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <div><strong>Pretiahnite XML súbor sem</strong></div>
      <div style={{ marginTop: 8 }}>alebo vyberte súbor z počítača</div>
      <button type="button" style={{ marginTop: 16 }}>Vybrať XML súbor</button>
    </div>
  );
};
