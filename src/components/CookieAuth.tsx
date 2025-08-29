import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Cookie, Globe, CheckCircle } from 'lucide-react';

interface CookieAuthProps {
  onCookieSet: (cookies: string, url: string) => void;
  isAuthenticated: boolean;
}

export const CookieAuth = ({ onCookieSet, isAuthenticated }: CookieAuthProps) => {
  const [cookies, setCookies] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const { toast } = useToast();

  const handleSetCookie = () => {
    if (!cookies.trim() || !targetUrl.trim()) {
      toast({
        title: "錯誤",
        description: "請輸入Cookie和目標網址",
        variant: "destructive",
      });
      return;
    }

    onCookieSet(cookies, targetUrl);
    toast({
      title: "成功",
      description: "Cookie設定完成",
    });
  };

  const copyInstructions = () => {
    const instructions = `獲取Cookie步驟：
1. 打開瀏覽器開發者工具 (F12)
2. 切換到 Network 標籤
3. 登入目標網站
4. 在Network中找到任一請求
5. 在Request Headers中複製Cookie值
6. 將Cookie貼到下方輸入框`;

    navigator.clipboard.writeText(instructions);
    toast({
      title: "已複製",
      description: "獲取Cookie的步驟已複製到剪貼板",
    });
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Cookie className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Cookie 認證設定
              {isAuthenticated && (
                <CheckCircle className="w-5 h-5 text-success" />
              )}
            </CardTitle>
            <CardDescription>
              設定登入Cookie來存取需要驗證的網頁
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        <div className="bg-muted/30 p-4 rounded-lg border border-dashed border-primary/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                如何獲取Cookie？
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. 打開瀏覽器開發者工具 (F12)</li>
                <li>2. 切換到 Network 標籤</li>
                <li>3. 登入目標網站</li>
                <li>4. 在Network中找到任一請求</li>
                <li>5. 在Request Headers中複製Cookie值</li>
              </ol>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyInstructions}
              className="shrink-0"
            >
              <Copy className="w-4 h-4 mr-2" />
              複製步驟
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="url">目標網址</Label>
            <Input
              id="url"
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com/protected-page"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="cookies">Cookie 值</Label>
            <Textarea
              id="cookies"
              value={cookies}
              onChange={(e) => setCookies(e.target.value)}
              placeholder="sessionid=abc123; csrftoken=xyz789; ..."
              className="min-h-[100px] mt-1 font-mono text-sm"
            />
          </div>

          <Button 
            onClick={handleSetCookie}
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all duration-300"
            disabled={isAuthenticated}
          >
            {isAuthenticated ? "已設定Cookie" : "設定Cookie"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};