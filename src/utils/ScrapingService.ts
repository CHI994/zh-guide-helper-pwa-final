interface ScrapingResult {
  success: boolean;
  data?: {
    title?: string;
    content?: string;
    links?: string[];
    images?: string[];
  };
  error?: string;
}

export class ScrapingService {
  static async scrapeWithCookies(url: string, cookies: string): Promise<ScrapingResult> {
    try {
      // 使用CORS代理服務進行抓取
      const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
          // 注意：由於CORS限制，實際的Cookie可能無法在前端直接使用
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const parsedData = this.parseHTML(html);
      
      return {
        success: true,
        data: parsedData
      };
    } catch (error) {
      console.error('Scraping error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      };
    }
  }

  private static parseHTML(html: string) {
    // 創建臨時DOM來解析HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 提取標題
    const title = doc.querySelector('title')?.textContent || '';
    
    // 提取文本內容
    const bodyText = doc.body?.textContent || '';
    const cleanContent = bodyText.replace(/\s+/g, ' ').trim();
    
    // 提取所有連結
    const linkElements = doc.querySelectorAll('a[href]');
    const links = Array.from(linkElements)
      .map(link => (link as HTMLAnchorElement).href)
      .filter(href => href && !href.startsWith('javascript:'))
      .slice(0, 50); // 限制連結數量
    
    // 提取圖片
    const imgElements = doc.querySelectorAll('img[src]');
    const images = Array.from(imgElements)
      .map(img => (img as HTMLImageElement).src)
      .filter(src => src)
      .slice(0, 20); // 限制圖片數量
    
    return {
      title,
      content: cleanContent,
      links,
      images
    };
  }

  // 模擬使用Cookie的後端服務（實際應用中需要後端支持）
  static async scrapeWithBackendService(url: string, cookies: string): Promise<ScrapingResult> {
    try {
      // 這裡應該調用您的後端API
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          cookies
        })
      });

      if (!response.ok) {
        throw new Error(`API錯誤: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Backend scraping error:', error);
      return {
        success: false,
        error: '後端服務不可用，請使用前端解決方案'
      };
    }
  }
}