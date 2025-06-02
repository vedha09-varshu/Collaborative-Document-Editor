// client/src/Editor.js
import React, { useEffect, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { io } from 'socket.io-client';

const SAVE_INTERVAL_MS = 2000;

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'image'],
  ['clean'],
];

const Editor = () => {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);

  // Connect to Socket.IO server
  useEffect(() => {
    const s = io('http://localhost:3001');
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Initialize Quill editor
  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;

    wrapper.innerHTML = '';
    const editor = document.createElement('div');
    wrapper.append(editor);

    const q = new Quill(editor, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR_OPTIONS },
    });

    q.disable();
    q.setText('Loading...');
    setQuill(q);
  }, []);

  // Load document data from server when socket & quill ready
  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once('load-document', (document) => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit('get-document', documentId);
  }, [socket, quill, documentId]);

  // Save document to server every SAVE_INTERVAL_MS
  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit('save-document', quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [socket, quill]);

  // Receive full document contents from other clients and replace locally
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (contents) => {
      quill.setContents(contents);
    };

    socket.on('receive-changes', handler);

    return () => {
      socket.off('receive-changes', handler);
    };
  }, [socket, quill]);

  // Send full document contents on user changes only
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', quill.getContents());
    };

    quill.on('text-change', handler);

    return () => {
      quill.off('text-change', handler);
    };
  }, [socket, quill]);

  return <div className="container" ref={wrapperRef} style={{ height: '100vh' }}></div>;
};

export default Editor;
