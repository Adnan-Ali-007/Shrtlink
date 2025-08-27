class URLShortener {
    constructor() {
        this.baseUrl = window.location.origin + '/';
        this.urls = this.loadUrls();
        this.initializeEventListeners();
        this.displayUrls();
    }

    initializeEventListeners() {
        const form = document.getElementById('shortenForm');
        const copyBtn = document.getElementById('copyBtn');

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    generateSlug(length = 6) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const urlInput = document.getElementById('urlInput');
        const submitBtn = document.getElementById('submitBtn');
        const resultDiv = document.getElementById('result');
        const errorDiv = document.getElementById('error');
        
        const originalUrl = urlInput.value.trim();
        
        // Hide previous results
        resultDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        
        // Validate URL
        if (!this.isValidUrl(originalUrl)) {
            this.showError('Please enter a valid URL (must start with http:// or https://)');
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Shortening...';
        
        try {
            // Generate unique slug
            let slug;
            do {
                slug = this.generateSlug();
            } while (this.urls.some(url => url.slug === slug));
            
            // Create short URL
            const shortUrl = this.baseUrl + slug;
            
            // Store the URL mapping
            const urlData = {
                slug,
                original: originalUrl,
                short: shortUrl,
                created: new Date().toISOString(),
                clicks: 0
            };
            
            this.urls.unshift(urlData);
            this.saveUrls();
            
            // Show result
            this.showResult(shortUrl);
            this.displayUrls();
            
            // Clear input
            urlInput.value = '';
            
        } catch (error) {
            this.showError('An error occurred while shortening the URL. Please try again.');
        } finally {
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Shorten';
        }
    }

    showResult(shortUrl) {
        const resultDiv = document.getElementById('result');
        const shortLink = document.getElementById('shortLink');
        
        shortLink.href = shortUrl;
        shortLink.textContent = shortUrl;
        resultDiv.style.display = 'block';
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    async copyToClipboard() {
        const shortLink = document.getElementById('shortLink');
        const copyBtn = document.getElementById('copyBtn');
        
        try {
            await navigator.clipboard.writeText(shortLink.href);
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.textContent = 'Copy Link';
                copyBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shortLink.href;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy Link';
            }, 2000);
        }
    }

    displayUrls() {
        const urlList = document.getElementById('urlList');
        const urlItems = document.getElementById('urlItems');
        
        if (this.urls.length === 0) {
            urlList.style.display = 'none';
            return;
        }
        
        urlItems.innerHTML = '';
        
        // Show only the last 5 URLs
        const recentUrls = this.urls.slice(0, 5);
        
        recentUrls.forEach(urlData => {
            const item = document.createElement('div');
            item.className = 'url-item';
            item.innerHTML = `
                <div class="original">📄 ${this.truncateUrl(urlData.original, 50)}</div>
                <div class="short">🔗 <a href="${urlData.short}" target="_blank">${urlData.short}</a></div>
            `;
            urlItems.appendChild(item);
        });
        
        urlList.style.display = 'block';
    }

    truncateUrl(url, maxLength) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    }

    loadUrls() {
        try {
            const stored = localStorage.getItem('shortlink_urls');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    saveUrls() {
        try {
            // Keep only the last 50 URLs to prevent localStorage from getting too large
            const urlsToSave = this.urls.slice(0, 50);
            localStorage.setItem('shortlink_urls', JSON.stringify(urlsToSave));
        } catch (error) {
            console.warn('Could not save URLs to localStorage:', error);
        }
    }

    // Handle redirection for short URLs
    handleRedirection() {
        const path = window.location.pathname;
        if (path.length > 1) {
            const slug = path.substring(1);
            const urlData = this.urls.find(url => url.slug === slug);
            
            if (urlData) {
                // Increment click count
                urlData.clicks++;
                this.saveUrls();
                
                // Redirect to original URL
                window.location.href = urlData.original;
                return true;
            } else {
                // Show 404 page
                this.show404();
                return true;
            }
        }
        return false;
    }

    show404() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, #4f46e5, #ec4899);
                color: white;
                text-align: center;
                padding: 20px;
            ">
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 40px;
                    max-width: 500px;
                ">
                    <h1 style="font-size: 3rem; margin-bottom: 1rem;">😢</h1>
                    <h2 style="margin-bottom: 1rem;">404 - URL Not Found</h2>
                    <p style="margin-bottom: 2rem; color: #e0e0e0;">
                        The shortlink you followed doesn't exist or may have expired.
                    </p>
                    <a href="/" style="
                        background: #10b981;
                        color: white;
                        text-decoration: none;
                        padding: 12px 24px;
                        border-radius: 10px;
                        display: inline-block;
                        transition: background 0.3s ease;
                    ">Go Home</a>
                </div>
            </div>
        `;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const app = new URLShortener();
    
    // Check if this is a redirection request
    if (!app.handleRedirection()) {
        // Normal page load - app is already initialized
    }
});