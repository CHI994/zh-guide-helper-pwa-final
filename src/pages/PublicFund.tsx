import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Coins, TrendingUp, PieChart, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "@/hooks/useCustomAuth";

interface PublicFundRecord {
  id: number;
  type: string;
  amount: number;
  reason: string;
  date: string;
  category: string;
  rate?: number;
  totalAmount?: number;
  participants?: string[];
  bossName?: string;
  serverName?: string;
  description?: string;
  createdBy?: string;
}

interface PublicFundData {
  totalBalance: number;
  totalCollected: number;
  records: PublicFundRecord[];
}

const PublicFund = () => {
  const navigate = useNavigate();
  const { profile, team, user } = useCustomAuth();
  const [publicFundData, setPublicFundData] = useState<PublicFundData>({
    totalBalance: 0,
    totalCollected: 0,
    records: []
  });

  useEffect(() => {
    // Load public fund data from localStorage
    loadPublicFundData();
    
    // Listen for public fund updates
    const handlePublicFundUpdate = () => {
      loadPublicFundData();
    };
    
    window.addEventListener('publicFundUpdate', handlePublicFundUpdate);
    return () => window.removeEventListener('publicFundUpdate', handlePublicFundUpdate);
  }, []);

  const loadPublicFundData = () => {
    // Load the actual balance from publicFundData
    const fundData = JSON.parse(localStorage.getItem('publicFundData') || '{}');
    const currentBalance = fundData.balance || 0;

    // Load manual records (提領/增加 operations)
    const manualRecords = JSON.parse(localStorage.getItem('publicFundRecords') || '[]');
    
    
    // Load distribution records as income
    const distributionRecords = JSON.parse(localStorage.getItem('diamondDistributions') || '[]');
    const distributionAsRecords = distributionRecords.map(dist => ({
      id: `dist_${dist.id}`,
      type: "收入",
      amount: dist.publicFundAmount || 0,
      reason: `拍賣抽成：${dist.itemName}`,
      date: dist.timestamp,
      category: dist.itemLevel || "拍賣抽成",
      rate: dist.publicFundRate || 0,
      totalAmount: dist.totalAmount || 0,
      participants: dist.participants || [],
      bossName: dist.bossName || "",
      serverName: dist.serverName || ""
    }));

    // Combine all records and sort by date
    const allRecords = [...manualRecords, ...distributionAsRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate total income (including historical)
    const totalIncome = allRecords
      .filter(record => record.type === "收入")
      .reduce((sum, record) => sum + record.amount, 0);

    setPublicFundData({
      totalBalance: currentBalance,
      totalCollected: totalIncome,
      records: allRecords
    });
  };

  const getItemLevelColor = (level: string) => {
    switch (level) {
      case "稀有": return "bg-blue-100 text-blue-800";
      case "英雄": return "bg-purple-100 text-purple-800";
      case "傳說": return "bg-amber-100 text-amber-800";
      case "公基金提領": return "bg-red-100 text-red-800";
      case "公基金增加": return "bg-green-100 text-green-800";
      case "充公收入": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getItemLevelIcon = (level: string) => {
    switch (level) {
      case "稀有": return "💎";
      case "英雄": return "⚔️";
      case "傳說": return "👑";
      case "公基金提領": return "💸";
      case "公基金增加": return "💰";
      case "充公收入": return "🏛️";
      default: return "🔮";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-treasure-deep-blue to-treasure-royal-blue p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
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
              🏛️ 公基金明細
            </h1>
            <p className="text-treasure-gold/80">
              {team?.name} | {user?.username}
            </p>
          </div>
        </div>

        {/* Overview Card */}
        <div className="flex justify-center mb-6">
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border max-w-md w-full">
            <CardContent className="p-8 text-center">
              <Coins className="w-16 h-16 mx-auto mb-4 text-treasure-gold" />
              <div className="text-4xl font-bold text-treasure-gold mb-3">{publicFundData.totalBalance}</div>
              <div className="text-lg text-treasure-gold/80">當前公基金額度</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction History */}
          <Card className="lg:col-span-2 bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-treasure-gold">
                <Calendar className="w-5 h-5" />
                公積金交易記錄
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {publicFundData.records.map((record) => (
                    <div key={record.id} className={`p-4 rounded-lg border hover:opacity-80 transition-colors ${
                      record.type === "收入" 
                        ? "bg-green-500/10 border-green-500/30" 
                        : "bg-red-500/10 border-red-500/30"
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg">{getItemLevelIcon(record.category)}</span>
                            <span className="font-medium text-treasure-gold">{record.reason}</span>
                            <Badge className={`${getItemLevelColor(record.category)} text-xs`}>
                              {record.category}
                            </Badge>
                          </div>
                          <div className="text-sm text-treasure-gold/70 space-y-1">
                            {record.totalAmount && (
                              <div>拍賣總額：{record.totalAmount} 鑽石 ({record.rate}% 抽成)</div>
                            )}
                            {record.participants && record.participants.length > 0 && (
                              <div>參與人數：{record.participants.length} 人</div>
                            )}
                            {record.bossName && (
                              <div>BOSS：{record.bossName} | 伺服器：{record.serverName}</div>
                            )}
                            {record.description && record.description !== record.reason && (
                              <div>說明：{record.description}</div>
                            )}
                            <div className="text-xs">{record.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-lg ${
                            record.type === "收入" ? "text-green-400" : "text-red-400"
                          }`}>
                            {record.type === "收入" ? "+" : "-"}{record.amount} 鑽石
                          </div>
                          <Badge className={
                            record.type === "收入" 
                              ? "bg-green-500/20 text-green-400 border-green-500/30" 
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }>
                            {record.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {publicFundData.records.length === 0 && (
                  <div className="text-center py-8 text-treasure-gold/50">
                    <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>尚無公積金記錄</p>
                    <p className="text-sm mt-2">當有拍賣成交時，系統會自動抽取公積金</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Notes/Remarks */}
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardHeader>
              <CardTitle className="text-treasure-gold">備註紀錄</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {publicFundData.records.map((record) => (
                    <div key={`note-${record.id}`} className={`p-3 rounded-lg border ${
                      record.type === "收入" 
                        ? "bg-green-500/10 border-green-500/30" 
                        : "bg-red-500/10 border-red-500/30"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${
                            record.type === "收入" ? "text-green-400" : "text-red-400"
                          }`}>
                            {record.type === "收入" ? "+" : "-"}{record.amount} 鑽石
                          </span>
                          <Badge className={
                            record.type === "收入" 
                              ? "bg-green-500/20 text-green-400 border-green-500/30" 
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }>
                            {record.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-treasure-gold/70">
                          {record.date}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-treasure-gold mb-1">
                        {record.reason}
                      </div>
                      {record.description && record.description !== record.reason && (
                        <div className="text-xs text-treasure-gold/60">
                          說明：{record.description}
                        </div>
                      )}
                      <div className="text-xs text-treasure-gold/50 mt-1">
                        類型：{record.category} | 操作人：{record.createdBy || "系統"}
                      </div>
                    </div>
                  ))}
                  
                  {publicFundData.records.length === 0 && (
                    <div className="text-center py-8 text-treasure-gold/50">
                      <p className="text-sm">暫無備註紀錄</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicFund;