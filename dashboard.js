class ProductDashboard {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.sortField = null;
        this.sortDirection = 'asc';
        this.searchTerm = '';
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadProducts();
        this.renderTable();
        this.renderPagination();
    }

    bindEvents() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.currentPage = 1;
            this.filterAndSortProducts();
            this.renderTable();
            this.renderPagination();
        });

        // Page size change
        document.getElementById('pageSize').addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.renderTable();
            this.renderPagination();
        });

        // Sorting buttons
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const field = btn.dataset.sort;
                this.sortProducts(field);
                this.updateSortButtonStates(btn);
            });
        });

        // Export CSV
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportToCSV();
        });

        // Add product modal
        document.getElementById('addProductBtn').addEventListener('click', () => {
            new bootstrap.Modal(document.getElementById('addProductModal')).show();
        });

        // Create product
        document.getElementById('createProductBtn').addEventListener('click', () => {
            this.createProduct();
        });

        // Save product changes
        document.getElementById('saveProductBtn').addEventListener('click', () => {
            this.updateProduct();
        });

        // Tooltip handling
        this.setupTooltips();
    }

    async loadProducts() {
        try {
            const response = await fetch('https://api.escuelajs.co/api/v1/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            
            this.products = await response.json();
            this.filteredProducts = [...this.products];
        } catch (error) {
            console.error('Error loading products:', error);
            document.getElementById('productTableBody').innerHTML = 
                '<tr><td colspan="5" class="error">Không thể tải dữ liệu sản phẩm</td></tr>';
        }
    }

    filterAndSortProducts() {
        // Filter by search term
        this.filteredProducts = this.products.filter(product => 
            product.title.toLowerCase().includes(this.searchTerm)
        );

        // Sort products
        if (this.sortField) {
            this.filteredProducts.sort((a, b) => {
                let aVal = a[this.sortField];
                let bVal = b[this.sortField];
                
                if (this.sortField === 'price') {
                    aVal = parseFloat(aVal);
                    bVal = parseFloat(bVal);
                }
                
                if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
    }

    sortProducts(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        this.updateSortButtonStates();
        this.filterAndSortProducts();
        this.renderTable();
    }

    updateSortIcons() {
        document.querySelectorAll('.sort-btn').forEach(btn => {
            const icon = btn.querySelector('.sort-icon');
            if (btn.dataset.sort === this.sortField) {
                icon.className = `bi sort-icon ${this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down'}`;
            } else {
                icon.className = 'bi bi-arrow-up-down sort-icon';
            }
        });
    }

    updateSortButtonStates(activeBtn = null) {
        // Reset all buttons
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Activate the clicked button
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Update icons
        this.updateSortIcons();
    }

    renderTable() {
        const tbody = document.getElementById('productTableBody');
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageProducts = this.filteredProducts.slice(start, end);

        if (pageProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không tìm thấy sản phẩm</td></tr>';
            return;
        }

        tbody.innerHTML = pageProducts.map(product => `
            <tr data-product='${JSON.stringify(product)}' data-description="${product.description}">
                <td>${product.id}</td>
                <td>${product.title}</td>
                <td>$${product.price}</td>
                <td>${product.category?.name || 'N/A'}</td>
                <td>
                    ${product.images && product.images.length > 0 
                        ? `<img src="${product.images[0]}" class="product-image" alt="${product.title}">`
                        : '<span class="text-muted">No image</span>'
                    }
                </td>
            </tr>
        `).join('');

        // Add click event for product details
        tbody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', () => {
                const product = JSON.parse(row.dataset.product);
                this.showProductModal(product);
            });
        });
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        
        // Previous button
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">Trước</a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Next button
        html += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">Sau</a>
            </li>
        `;

        pagination.innerHTML = html;

        // Add click events
        pagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    this.renderTable();
                    this.renderPagination();
                }
            });
        });
    }

    setupTooltips() {
        const tooltip = document.getElementById('customTooltip');
        
        document.addEventListener('mouseover', (e) => {
            const row = e.target.closest('tr[data-description]');
            if (row) {
                const description = row.dataset.description;
                if (description) {
                    tooltip.textContent = description;
                    tooltip.style.display = 'block';
                    tooltip.style.left = e.clientX + 10 + 'px';
                    tooltip.style.top = e.clientY + 10 + 'px';
                }
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('tr[data-description]')) {
                tooltip.style.display = 'none';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (tooltip.style.display === 'block') {
                tooltip.style.left = e.clientX + 10 + 'px';
                tooltip.style.top = e.clientY + 10 + 'px';
            }
        });
    }

    showProductModal(product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productTitle').value = product.title;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productCategory').value = product.category?.id || '1';
        document.getElementById('productImages').value = product.images ? product.images.join(', ') : '';
        
        document.getElementById('modalTitle').textContent = 'Chi tiết sản phẩm: ' + product.title;
        new bootstrap.Modal(document.getElementById('productModal')).show();
    }

    async updateProduct() {
        const productId = document.getElementById('productId').value;
        const updatedProduct = {
            title: document.getElementById('productTitle').value,
            price: parseFloat(document.getElementById('productPrice').value),
            description: document.getElementById('productDescription').value,
            categoryId: parseInt(document.getElementById('productCategory').value),
            images: document.getElementById('productImages').value
                .split(',')
                .map(url => url.trim())
                .filter(url => url.length > 0)
        };

        try {
            const response = await fetch(`https://api.escuelajs.co/api/v1/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedProduct)
            });

            if (!response.ok) throw new Error('Failed to update product');

            // Update local data
            const index = this.products.findIndex(p => p.id == productId);
            if (index !== -1) {
                this.products[index] = { ...this.products[index], ...updatedProduct };
                this.filterAndSortProducts();
                this.renderTable();
            }

            bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
            alert('Cập nhật sản phẩm thành công!');
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Có lỗi xảy ra khi cập nhật sản phẩm!');
        }
    }

    async createProduct() {
        // Get form values
        const title = document.getElementById('addProductTitle').value.trim();
        const price = parseFloat(document.getElementById('addProductPrice').value);
        const description = document.getElementById('addProductDescription').value.trim();
        const categoryId = parseInt(document.getElementById('addProductCategory').value);
        const imagesInput = document.getElementById('addProductImages').value.trim();

        // Validation
        if (!title) {
            alert('Vui lòng nhập tiêu đề sản phẩm!');
            document.getElementById('addProductTitle').focus();
            return;
        }

        if (!price || price <= 0) {
            alert('Vui lòng nhập giá sản phẩm hợp lệ!');
            document.getElementById('addProductPrice').focus();
            return;
        }

        if (!categoryId) {
            alert('Vui lòng chọn danh mục sản phẩm!');
            document.getElementById('addProductCategory').focus();
            return;
        }

        // Process images
        let images = [];
        if (imagesInput) {
            images = imagesInput
                .split(',')
                .map(url => url.trim())
                .filter(url => url.length > 0);
        }

        // If no images provided, use a default placeholder
        if (images.length === 0) {
            images = ['https://via.placeholder.com/300x200?text=No+Image'];
        }

        const newProduct = {
            title: title,
            price: price,
            description: description || 'No description provided',
            categoryId: categoryId,
            images: images
        };

        // Log the exact data being sent
        console.log('Sending product data:', JSON.stringify(newProduct, null, 2));

        try {
            console.log('Creating product with data:', newProduct);
            
            const response = await fetch('https://api.escuelajs.co/api/v1/products/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newProduct)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { message: errorText };
                }
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const createdProduct = await response.json();
            
            // Add to local data
            this.products.unshift(createdProduct);
            this.filterAndSortProducts();
            this.currentPage = 1;
            this.renderTable();
            this.renderPagination();

            // Reset form and close modal
            document.getElementById('addProductForm').reset();
            try {
                const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
                if (modal) {
                    modal.hide();
                } else {
                    // Fallback: hide using jQuery-like method or direct DOM manipulation
                    document.getElementById('addProductModal').classList.remove('show');
                    document.querySelector('.modal-backdrop')?.remove();
                    document.body.classList.remove('modal-open');
                    document.body.style.removeProperty('padding-right');
                }
            } catch (modalError) {
                console.error('Error hiding modal:', modalError);
            }
            alert('Tạo sản phẩm thành công!');
        } catch (error) {
            console.error('Error creating product:', error);
            alert(`Có lỗi xảy ra khi tạo sản phẩm: ${error.message}`);
        }
    }

    exportToCSV() {
        const currentData = this.filteredProducts.slice(
            (this.currentPage - 1) * this.pageSize,
            this.currentPage * this.pageSize
        );

        if (currentData.length === 0) {
            alert('Không có dữ liệu để export!');
            return;
        }

        const headers = ['ID', 'Title', 'Price', 'Description', 'Category', 'Images'];
        const csvContent = [
            headers.join(','),
            ...currentData.map(product => [
                product.id,
                `"${product.title.replace(/"/g, '""')}"`,
                product.price,
                `"${(product.description || '').replace(/"/g, '""')}"`,
                `"${(product.category?.name || 'N/A').replace(/"/g, '""')}"`,
                `"${(product.images || []).join('; ').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `products_page_${this.currentPage}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProductDashboard();
});