export const UISearchResultList = () => {
    return class UISearchResults extends HTMLElement {
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
            if (data.isError()) {
                this.renderEmptyState();
                return;
            }

            this.innerHTML = `
                <ion-list>
                ${data.getValue()
                    .map(
                    (item, index) => `
                        <ion-item 
                        button 
                        detail="true" 
                        class="search-item"
                        style="animation-delay: ${index * 60}ms"
                        href="#"
                        >
                        <ion-label>
                            <h3>${item.name}</h3>
                            <p>${item.producer_id}</p>
                        </ion-label>
                        </ion-item>
                    `
                    )
                    .join('')}
                </ion-list>
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
            <ion-text color="danger">
                <p style="text-align:center; margin-top: 40px;">
                Something went wrong. Try again later.
                </p>
            </ion-text>
            `;
        }
    }
};

