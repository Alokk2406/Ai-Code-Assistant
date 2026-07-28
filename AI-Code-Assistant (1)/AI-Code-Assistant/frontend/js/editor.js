/* Monaco editor bootstrap. Exposes window.Editors once ready. */
window.Editors = { main: null, convert: null, ready: false, _onReady: [] };

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.49.0/min/vs' } });

require(['vs/editor/editor.main'], function () {
  monaco.editor.defineTheme('aca-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0b0f1a',
      'editor.lineHighlightBackground': '#121729',
      'editorLineNumber.foreground': '#3d4560',
      'editorCursor.foreground': '#22d3ee',
    },
  });

  window.Editors.main = monaco.editor.create(document.getElementById('monacoEditor'), {
    value: '# Write or paste code here, then run an action below.\n',
    language: 'python',
    theme: 'aca-dark',
    automaticLayout: true,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    minimap: { enabled: false },
  });

  window.Editors.convert = monaco.editor.create(document.getElementById('monacoEditorConvert'), {
    value: '# Paste code to convert to another language\n',
    language: 'python',
    theme: 'aca-dark',
    automaticLayout: true,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    minimap: { enabled: false },
  });

  window.Editors.ready = true;
  window.Editors._onReady.forEach((fn) => fn());
});

window.Editors.whenReady = function (fn) {
  if (window.Editors.ready) fn();
  else window.Editors._onReady.push(fn);
};
