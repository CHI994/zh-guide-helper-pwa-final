import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Globe, Download, Eye } from 'lucide-react';
import { ScrapingService } from '@/utils/ScrapingService';

interface WebScraperProps {
  cookies: string;
  isAuthenticated: boolean;
}

interface ScrapingResult {
  title?: string;
  content?: string;
  links?: string[];
  images?: string[];
  error?: string;
}

export const WebScraper = ({ cookies, isAuthenticated }: WebScraperProps) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const { toast } = useToast();

  const handleScrape = async () => {
    if (!url.trim()) {
      toast({
        title: "錯誤",
        description: "請輸入要分析的網址",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "錯誤", 
        description: "請先設定Cookie認證",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const scrapingResult = await ScrapingService.scrapeWithCookies(url, cookies);
      
      if (scrapingResult.success) {
        setResult(scrapingResult.data);
        toast({
          title: "成功",
          description: "網頁分析完成",
        });
      } else {
        setResult({ error: scrapingResult.error });
        toast({
          title: "錯誤",
          description: scrapingResult.error || "網頁分析失敗",
          variant: "destructive",
        });
      }
    } catch (error) {
      setResult({ error: "網絡錯誤或服務不可用" });
      toast({
        title: "錯誤",
        description: "網絡錯誤或服務不可用",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scraping-result-${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-transparent" />
      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-info/10">
            <Globe className="w-5 h-5 text-info" />
          </div>
          <div>
            <CardTitle>網頁分析工具</CardTitle>
            <CardDescription>
              使用Cookie認證分析受保護的網頁內容
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="scrape-url">要分析的網址</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="scrape-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/protected-content"
                disabled={isLoading || !isAuthenticated}
              />
              <Button 
                onClick={handleScrape}
                disabled={isLoading || !isAuthenticated}
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {isLoading ? "分析中..." : "開始分析"}
              </Button>
            </div>
          </div>
          
          {!isAuthenticated && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <p className="text-sm text-warning-foreground">
                ⚠️ 請先在上方設定Cookie認證才能進行網頁分析
              </p>
            </div>
          )}
        </div>

        {result && (
          <Card className="bg-card/50 border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">分析結果</CardTitle>
                {!result.error && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadResult}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下載結果
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.error ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive">{result.error}</p>
                </div>
              ) : (
                <>
                  {result.title && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">頁面標題</h4>
                      <p className="text-sm bg-muted/50 p-3 rounded border">
                        {result.title}
                      </p>
                    </div>
                  )}
                  
                  {result.content && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">頁面內容預覽</h4>
                      <div className="bg-muted/50 p-3 rounded border max-h-40 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">
                          {result.content.substring(0, 500)}
                          {result.content.length > 500 && "..."}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {result.links && result.links.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        發現的連結 ({result.links.length}個)
                      </h4>
                      <div className="bg-muted/50 p-3 rounded border max-h-32 overflow-y-auto">
                        <ul className="space-y-1">
                          {result.links.slice(0, 10).map((link, index) => (
                            <li key={index} className="text-sm text-muted-foreground">
                              {link}
                            </li>
                          ))}
                          {result.links.length > 10 && (
                            <li className="text-sm text-muted-foreground">
                              ...還有{result.links.length - 10}個連結
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};