export class Modal {
    private modal: HTMLDivElement;
    
    constructor() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2></h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body"></div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        
        // Close on overlay click
        this.modal.querySelector('.modal-overlay')?.addEventListener('click', () => this.close());
        this.modal.querySelector('.modal-close')?.addEventListener('click', () => this.close());
    }
    
    show(title: string, content: HTMLElement) {
        const header = this.modal.querySelector('.modal-header h2');
        const body = this.modal.querySelector('.modal-body');
        
        if (header) header.textContent = title;
        if (body) {
            body.innerHTML = '';
            body.appendChild(content);
        }
        
        this.modal.classList.add('show');
    }
    
    close() {
        this.modal.classList.remove('show');
    }
} 