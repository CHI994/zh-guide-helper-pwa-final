import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Megaphone, Pin, MessageSquare, Calendar, Percent, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Announcements = () => {
  const navigate = useNavigate();
  const { profile, team } = useAuth();
  const [announcements, setAnnouncements] = useState([]);

  // Load announcements from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('announcements');
    if (saved) {
      const allAnnouncements = JSON.parse(saved);
      // Only show published announcements
      const publishedAnnouncements = allAnnouncements.filter(announcement => announcement.published !== false);
      setAnnouncements(publishedAnnouncements);
    }
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "重要": return "bg-red-100 text-red-800";
      case "系統": return "bg-blue-100 text-blue-800";
      case "維護": return "bg-orange-100 text-orange-800";
      case "一般": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首頁
          </Button>
          <div className="text-white">
            <h1 className="text-3xl font-bold">📢 團隊公告</h1>
            <p className="text-slate-300">
              {team?.name} | 最新消息與重要通知
            </p>
          </div>
        </div>

        {/* Auction Commission Settings Display */}
        <Card className="bg-slate-700/50 text-white border-slate-600 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              拍賣抽成設定
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Percent className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-300">一般物品</p>
                  <p className="text-lg font-bold text-white">
                    {(() => {
                      const basicSettings = JSON.parse(localStorage.getItem('basicSettings') || '{}');
                      return basicSettings.auctionCommissionRate ?? 10;
                    })()}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Percent className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-300">英雄物品</p>
                  <p className="text-lg font-bold text-white">
                    {(() => {
                      const basicSettings = JSON.parse(localStorage.getItem('basicSettings') || '{}');
                      return basicSettings.auctionCommissionRateHero ?? 12;
                    })()}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Percent className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-300">傳說物品</p>
                  <p className="text-lg font-bold text-white">
                    {(() => {
                      const basicSettings = JSON.parse(localStorage.getItem('basicSettings') || '{}');
                      return basicSettings.auctionCommissionRateLegendary ?? 15;
                    })()}%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-sm text-slate-200">
                💡 <strong>分鑽機制說明：</strong>拍賣成交後，系統將依據物品等級自動計算抽成比例，抽成金額將轉入公基金，供團隊共同運用。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {announcement.pinned && (
                        <Pin className="w-4 h-4 text-yellow-500" />
                      )}
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <Badge className={getTypeColor(announcement.type)}>
                        {announcement.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>發布者：{announcement.author}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {announcement.publishDate}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="text-gray-700 mb-4 leading-relaxed">
                  {formatContent(announcement.content)}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>👁️ {announcement.readCount} 人閱讀</span>
                    <span>💬 {announcement.commentCount} 則回覆</span>
                  </div>
                  <Button variant="outline" size="sm">
                    查看詳情
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {announcements.length === 0 && (
          <Card className="bg-white text-center p-12">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              暫無公告
            </h3>
            <p className="text-gray-500">
              管理員尚未發布任何公告，請稍後再來查看。
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Announcements;