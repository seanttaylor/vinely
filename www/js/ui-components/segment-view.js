/**
 * 
 */
export class UISegmentView extends HTMLElement {
    connectedCallback() {
        this.current = this.querySelector('[data-view].active');
    }

    /**
     * Removes any existing animation classes from an element
     *  @param {object} el - a DOM element
     */
    reset(el) {
        el.classList.remove(
            'enter',
            'exit',
            'forward',
            'back',
            'active'
        );
    }

    /**
     * Pairs with `UISegmentedControl` component, synchronizes a selected segment control with
     * a view for animating sections of UI in and out
     * @param {string} target - the segment view to display
     * @param {string} [direction]
     */
    show(target, direction = 'forward') {
        const next = this.querySelector(`[data-view="${target}"]`);
        if (!next || next === this.current) return;

        const current = this.current;

        this.reset(next);
        if (current) this.reset(current);

        next.classList.remove('hidden');
        next.classList.add('enter', direction);

        next.offsetWidth; // force layout

        next.classList.add('active');
        next.classList.remove('enter');

        if (current) {
            current.classList.add('exit', direction);

            current.addEventListener('transitionend', () => {
                current.classList.remove('active', 'exit', direction);
                current.classList.add('hidden');
            }, { once: true });
        }

        this.current = next;
    }

}