import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, FileSearch, Users, Crown, DollarSign, Calendar, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const AccountInquiry = () => {
  const navigate = useNavigate();
  const { profile, team, user } = useCustomAuth();
  const { toast } = useToast();
  const [distributions, setDistributions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load distribution records from localStorage
    const distributionRecords = JSON.parse(localStorage.getItem('accountInquiryRecords') || '[]');
    setDistributions(distributionRecords);
  }, []);

  const getItemLevelColor = (level: string) => {
    switch (level) {
      case "稀有": return "text-blue-400 bg-blue-400/10";
      case "英雄": return "text-treasure-purple bg-purple-400/10";
      case "傳說": return "text-treasure-gold bg-treasure-gold/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  const getItemLevelIcon = (level: string) => {
    switch (level) {
      case "稀有": return "💎";
      case "英雄": return "⚔️";
      case "傳說": return "👑";
      default: return "🔮";
    }
  };

  // 過濾搜尋結果
  const filteredDistributions = distributions.filter(distribution =>
    distribution.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distribution.winner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distribution.bossName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 統計數據
  const totalDistributions = distributions.length;
  const totalDiamondsDistributed = distributions.reduce((sum, dist) => sum + dist.distributionAmount, 0);
  const totalPublicFund = distributions.reduce((sum, dist) => sum + dist.publicFundAmount, 0);

  const clearAllRecords = () => {
    localStorage.removeItem('accountInquiryRecords');
    setDistributions([]);
    toast({
      title: "清空成功",
      description: "所有入帳備查記錄已清空",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-treasure-deep-blue to-treasure-royal-blue p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="text-treasure-gold border-treasure-border hover:bg-treasure-surface backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁
            </Button>
            <div className="text-white">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-treasure-gold to-treasure-amber bg-clip-text text-transparent">
                📋 入帳備查區
              </h1>
              <p className="text-treasure-gold/80">
                {team?.name} | {user?.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 搜尋功能 */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-treasure-gold/70" />
              <Input
                placeholder="搜尋物品、得標者或BOSS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-treasure-surface/50 border-treasure-border text-white placeholder:text-treasure-gold/50"
              />
            </div>
            
            {/* 清空按鈕 */}
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllRecords}
              className="text-red-400 border-red-400/50 hover:bg-red-400/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清空記錄
            </Button>
          </div>
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-treasure-gold/20 rounded-lg">
                  <FileSearch className="w-5 h-5 text-treasure-gold" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">已處理分鑽</p>
                  <p className="text-xl font-bold text-treasure-gold">{totalDistributions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-treasure-amber/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-treasure-amber" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">總分鑽金額</p>
                  <p className="text-xl font-bold text-treasure-gold">{totalDiamondsDistributed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-treasure-purple/20 rounded-lg">
                  <Crown className="w-5 h-5 text-treasure-purple" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">總公基金</p>
                  <p className="text-xl font-bold text-treasure-gold">{totalPublicFund}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 分鑽記錄列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDistributions.map((distribution) => (
            <Card key={distribution.id} className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
              <CardHeader className="pb-3 bg-gradient-to-r from-treasure-gold/10 to-treasure-amber/10 border-b border-treasure-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-2xl">{getItemLevelIcon(distribution.itemLevel)}</span>
                    <div>
                      <div className="text-lg text-treasure-gold">{distribution.itemName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getItemLevelColor(distribution.itemLevel)}`}>
                          {distribution.itemLevel}
                        </Badge>
                        <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                          已入帳
                        </Badge>
                      </div>
                    </div>
                  </CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 p-6">
                <div className="text-sm text-treasure-gold/70">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4" />
                    <span>BOSS：{distribution.bossName}</span>
                  </div>
                  <div>伺服器：{distribution.serverName}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-treasure-gold/70">得標者</div>
                    <div className="font-semibold text-green-400">{distribution.winner}</div>
                  </div>
                  <div>
                    <div className="text-treasure-gold/70">成交金額</div>
                    <div className="font-semibold text-treasure-amber">
                      {distribution.totalAmount} 鑽石
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-treasure-gold/70">公基金 ({distribution.publicFundRate}%)</div>
                    <div className="font-semibold text-treasure-purple">
                      {distribution.publicFundAmount} 鑽石
                    </div>
                  </div>
                  <div>
                    <div className="text-treasure-gold/70">分鑽總額</div>
                    <div className="font-semibold text-treasure-gold">
                      {distribution.distributionAmount} 鑽石
                    </div>
                  </div>
                </div>

                <div className="bg-treasure-surface/30 rounded-lg p-3">
                  <div className="text-sm text-treasure-gold/70 mb-2">
                    參與成員 ({distribution.participants.length}人)
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {distribution.participants.map((participant, index) => (
                      <Badge key={index} className="text-xs bg-treasure-gold/20 text-treasure-gold border-treasure-border">
                        {participant}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-treasure-amber">
                    每人獲得：{distribution.amountPerParticipant} 鑽石
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-treasure-gold/60 pt-2 border-t border-treasure-border">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{distribution.timestamp}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredDistributions.length === 0 && (
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border text-center p-12">
            <FileSearch className="w-16 h-16 mx-auto mb-4 text-treasure-gold/30" />
            {searchTerm ? (
              <>
                <h3 className="text-xl font-semibold text-treasure-gold mb-2">
                  找不到符合條件的記錄
                </h3>
                <p className="text-treasure-gold/60 mb-4">
                  請嘗試其他搜尋關鍵字，或清除搜尋條件查看所有記錄。
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  className="border-treasure-border text-treasure-gold hover:bg-treasure-surface/30"
                >
                  清除搜尋
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-treasure-gold mb-2">
                  尚無入帳記錄
                </h3>
                <p className="text-treasure-gold/60 mb-4">
                  當拍賣完成並處理分鑽後，入帳記錄會顯示在這裡。
                </p>
                <Button
                  onClick={() => navigate("/completed")}
                  className="bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue"
                >
                  查看已完成交易
                </Button>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default AccountInquiry;