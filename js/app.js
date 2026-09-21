function calendarApp() {
    return {
        isGenerating: false,
        sidebarOpen: false,
        isAgencyOpen: false,
        isClientOpen: false,
        agency: {
            name: 'Write Your Agency Name',
            email: 'your@company.com',
            website: 'yourwebsite.com',
            phone: '(000) 000-0000',
            logo: null
        },
        client: {
            name: 'Add Client Name',
            subtitle: 'Social Media Content Calendar',
        },
        posts: [
            { image: null, headline: '', caption: '', hashtags: '' }
        ],

        checkNewPostNeeded(index) {
            if (index === this.posts.length - 1) {
                const post = this.posts[index];
                if (post.image) {
                    this.addPost();
                }
            }
        },
        addPost() {
            this.posts.push({ image: null, headline: '', caption: '', hashtags: '' });
        },
        removePost(index) {
            this.posts.splice(index, 1);
            if (this.posts.length === 0) {
                this.addPost();
            }
        },

        getDisplayUrl(url) {
            if (!url) return '';
            let domain = url.replace(/(^\w+:|^)\/\//, '').replace(/^www\./, '');
            domain = domain.split('/')[0];
            return 'www.' + domain;
        },

        uploadAgencyLogo(event) {
            const file = event.target.files[0];
            if (file) this.processFile(file, 'logo');
        },
        uploadPostImage(event, index) {
            const file = event.target.files[0];
            if (file) this.processFile(file, 'post', index);
        },
        handleDrop(event, type, index = null) {
            const file = event.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.processFile(file, type, index);
            }
        },
        processFile(file, type, index = null) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (type === 'logo') {
                    this.agency.logo = e.target.result;
                } else if (type === 'post') {
                    this.posts[index].image = e.target.result;
                    this.checkNewPostNeeded(index);
                }
            };
            reader.readAsDataURL(file);
        },

        resizeTextarea(el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        },

        async captureAndAdd(element) {
            return await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            }).then(canvas => {
                return canvas.toDataURL('image/jpeg', 0.9);
            });
        },

        async generatePDF() {
            this.isGenerating = true;
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DOM update

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4');
            const pages = document.querySelectorAll('.a4-page');
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();

            let pageAdded = false;

            // Helper to add image to PDF
            const addToDoc = (imgData) => {
                if (pageAdded) doc.addPage();
                doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pageAdded = true;
            }

            // 1. Render Cover Page (Always)
            const coverImg = await this.captureAndAdd(pages[0]);
            addToDoc(coverImg);

            // 2. Render Posts (FIX 2: SKIP EMPTY POSTS)
            for (let i = 0; i < this.posts.length; i++) {
                // Only add if the post has an image
                if (this.posts[i].image) {
                    // DOM element for post is at index i + 1 (because index 0 is cover)
                    const postImg = await this.captureAndAdd(pages[i + 1]);
                    addToDoc(postImg);
                }
            }

            // 3. Render Thank You Page (Always)
            // The thank you page is the last element in the 'pages' NodeList
            const thanksImg = await this.captureAndAdd(pages[pages.length - 1]);
            addToDoc(thanksImg);

            doc.save(this.client.name + '_Calendar.pdf');
            this.isGenerating = false;
        }
    }
}
