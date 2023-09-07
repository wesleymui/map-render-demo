import React from 'react';

interface FileInputProps extends React.PropsWithChildren {
  accept: string,
  id: string,
  onChange: React.ChangeEventHandler<HTMLInputElement>,
};

function FileInput({accept, children, id, onChange} : FileInputProps) {
  return (
    <div className="file-input-wrapper">
      <label htmlFor={id}>{children}</label>
      <br />
      <input type="file" id={id} accept={accept} onChange={onChange} multiple/>
    </div>
  );
}

export default FileInput;