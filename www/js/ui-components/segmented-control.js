export class UISegmentedControl extends HTMLElement {
    connectedCallback() {
        this.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-value]');
            if (!btn) return;

            const value = btn.dataset.value;
            const direction = btn.dataset.direction || 'forward';

            const indicator = this.querySelector('.segment-indicator');
            const buttons = [...this.querySelectorAll('[data-value]')];
            const index = buttons.indexOf(btn);

            indicator.style.transform = `translateX(${index * 100}%)`;

            // toggle active button UI
            this.querySelectorAll('[data-value]').forEach(el =>
                el.classList.toggle('active', el === btn)
            );

            // 🔥 THIS is Option 3
            const targetId = this.getAttribute('for');
            const target = document.getElementById(targetId);

            this.dispatchEvent(
                new CustomEvent('on_segment', {
                    detail: {
                        value
                    },
                    bubbles: true
                })
            );

            if (target && typeof target.show === 'function') {
                target.show(value, direction);
            } else {
                console.warn(`ui-segment: target "${targetId}" not found or has no show()`);
            }
        });
    }
}