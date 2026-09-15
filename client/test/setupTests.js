const { TextEncoder, TextDecoder } = require('util');

// jsdom lacks TextEncoder/TextDecoder, which React Router needs.
Object.assign(global, { TextEncoder, TextDecoder });

// jsdom lacks PointerEvent; without it pointer events lose clientY and pointer fields.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    constructor(type, init = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? '';
    }
  }
  window.PointerEvent = PointerEvent;
}

require('@testing-library/jest-dom');
