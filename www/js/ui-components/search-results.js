/**
 * 
 */
export class UISearchResults extends HTMLElement {
    connectedCallback() {
        this.renderEmptyState();

        // optional: signal ready
        setTimeout(() => {
            document.dispatchEvent(
                new CustomEvent('SEARCH_RESULTS_INITIALIZED')
            );
        }, 0);
    }

    /**
     * @param {Result<Object[]>} data
     */
    onComponentUpdate(data) {
        try {
            console.log(data)
            if (data.isError()) {
                this.renderEmptyState();
                return;
            }

            this.innerHTML = `
                <ul>
                ${data.getValue()
                    .map(
                        (item, index) => `
                    <li class="table-view-cell media search-item"
                        style="animation-delay: ${index * 60}ms">
    <a class="navigate-right" href="two.html" data-transition="slide-in">
      <div class="media-body">
        ${item.name}
        <p>${item.producer_id}</p>
      </div>
    </a>
  </li>                     
                    `
                    )
                    .join('')}
                </ul>
            `;
        } catch (ex) {
            console.error(
                `INTERNAL_ERROR (UISearchResults): **EXCEPTION ENCOUNTED** while rendering component update. See details -> ${ex.message}`
            );
            this.renderErrorState();
        }
    }

    renderEmptyState() {
        this.innerHTML = `
            <div class="empty-state">
                <ion-text color="medium">
                <p style="text-align:center; margin-top: 40px;">
                    Nothing to see here. Start a search to see results.
                </p>
                </ion-text>
            </div>
            `;
    }

    renderLoadingState() {
        this.innerHTML = `
            <ion-list>
                ${Array(5)
                .fill(0)
                .map(
                    () => `
                    <ion-item>
                    <ion-label>
                        <h3><ion-skeleton-text animated style="width: 70%"></ion-skeleton-text></h3>
                        <p><ion-skeleton-text animated style="width: 40%"></ion-skeleton-text></p>
                    </ion-label>
                    </ion-item>
                `
                )
                .join('')}
            </ion-list>
            `;
    }

    renderErrorState() {
        this.innerHTML = `
            <p color="danger">
                <p style="text-align:center; margin-top: 40px;">
                Something went wrong. Try again later.
                </p>
            </p>
            `;
    }
}
