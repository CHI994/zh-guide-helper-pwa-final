import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Trophy, Clock, Users, Crown, Eye, EyeOff, DollarSign, RotateCcw, Wallet, Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useToast } from "@/hooks/use-toast";

const CompletedTransactions = () => {
  const navigate = useNavigate();
  const { profile, team, user } = useCustomAuth();
  const { toast } = useToast();
  const [completedAuctions, setCompletedAuctions] = useState([]);
  const [paymentSelectionMode, setPaymentSelectionMode] = useState(new Set());

  useEffect(() => {
    // 從 localStorage 獲取已完成交易，只包含有成功競標的物品（winningBid > 0）
    const completedData = JSON.parse(localStorage.getItem('completedTransactions') || '[]');
    // 過濾掉流標物品（winningBid = 0 或 winner = '無人競標'）
    const filteredCompleted = completedData.filter(auction => 
      auction.winningBid > 0 && auction.winner !== '無人競標'
    );
    
    setCompletedAuctions(filteredCompleted);
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

  const clearCompletedTransactions = () => {
    localStorage.removeItem('completedTransactions');
    setCompletedAuctions([]);
  };

  const handleAccountEntry = (auction) => {
    // 進入付款方式選擇模式
    const newPaymentSelection = new Set(paymentSelectionMode);
    newPaymentSelection.add(auction.id);
    setPaymentSelectionMode(newPaymentSelection);
    
    toast({
      title: "請選擇付款方式",
      description: `請選擇 ${auction.winner} 的付款方式`,
    });
  };

  const completeDistribution = (auction) => {
    // 讀取基本設定
    const basicSettings = JSON.parse(localStorage.getItem('basicSettings') || '{}');
    
    // 根據物品等級決定公基金比例
    let publicFundRate = basicSettings.publicFundRate || 5;
    if (auction.itemLevel === '英雄') {
      publicFundRate = basicSettings.publicFundRateHero || 8;
    } else if (auction.itemLevel === '傳說') {
      publicFundRate = basicSettings.publicFundRateLegendary || 10;
    }
    
    // 計算公基金和分配金額
    const publicFundAmount = Math.floor(auction.winningBid * (publicFundRate / 100));
    const distributionAmount = auction.winningBid - publicFundAmount;
    const participantCount = auction.participants.length;
    const amountPerParticipant = Math.floor(distributionAmount / participantCount);
    
    // 記錄分配詳情
    const distributionRecord = {
      id: Date.now(),
      auctionId: auction.id,
      itemName: auction.itemName,
      itemLevel: auction.itemLevel,
      winner: auction.winner,
      totalAmount: auction.winningBid,
      publicFundRate: publicFundRate,
      publicFundAmount: publicFundAmount,
      distributionAmount: distributionAmount,
      participants: auction.participants,
      amountPerParticipant: amountPerParticipant,
      timestamp: new Date().toLocaleString('zh-TW'),
      bossName: auction.bossName,
      serverName: auction.serverName
    };
    
    // 儲存分配記錄到入帳備查區
    const existingAccountInquiry = JSON.parse(localStorage.getItem('accountInquiryRecords') || '[]');
    existingAccountInquiry.unshift(distributionRecord);
    localStorage.setItem('accountInquiryRecords', JSON.stringify(existingAccountInquiry));
    
    // 同時保存到diamondDistributions供公基金系統使用  
    const existingDistributions = JSON.parse(localStorage.getItem('diamondDistributions') || '[]');
    existingDistributions.unshift(distributionRecord);
    localStorage.setItem('diamondDistributions', JSON.stringify(existingDistributions));
    
    // 為每個參與者創建錢包交易記錄
    const existingTransactions = JSON.parse(localStorage.getItem('walletTransactions') || '[]');
    
    // 為每個參與者創建分鑽收益記錄
    auction.participants.forEach(participant => {
      const transaction = {
        id: Date.now() + Math.random(),
        type: "獲得",
        amount: amountPerParticipant,
        reason: `分鑽收益：${auction.itemName}`,
        date: new Date().toLocaleString('zh-TW'),
        category: "分鑽收益",
        participant: participant, // 確保participant名稱與實際用戶名一致
        itemName: auction.itemName,
        itemLevel: auction.itemLevel
      };
      existingTransactions.unshift(transaction);
    });
    
    localStorage.setItem('walletTransactions', JSON.stringify(existingTransactions));
    
    // 觸發錢包更新事件
    window.dispatchEvent(new Event('walletUpdate'));
    
    // 從已完成交易中移除這個項目，因為已經移動到入帳備查區
    const updatedCompletedAuctions = completedAuctions.filter(item => item.id !== auction.id);
    setCompletedAuctions(updatedCompletedAuctions);
    localStorage.setItem('completedTransactions', JSON.stringify(updatedCompletedAuctions));
    
    // 移除付款選擇模式
    const newPaymentSelection = new Set(paymentSelectionMode);
    newPaymentSelection.delete(auction.id);
    setPaymentSelectionMode(newPaymentSelection);
  };

  const handleWalletPayment = (auction) => {
    // 獲取得標者的當前錢包餘額
    const existingTransactions = JSON.parse(localStorage.getItem('walletTransactions') || '[]');
    
    // 計算得標者的當前餘額
    const winnerTransactions = existingTransactions.filter(transaction => 
      transaction.participant === auction.winner
    );
    
    // Get winner's starting balance from localStorage, default to 0
    const winnerStartingBalanceKey = `userStartingBalance_${auction.winner}`;
    const winnerStartingBalance = parseInt(localStorage.getItem(winnerStartingBalanceKey) || '0');
    
    // 計算當前餘額（包含用戶的起始餘額）
    const currentBalance = winnerTransactions.reduce((total, transaction) => {
      return total + (transaction.amount || 0);
    }, winnerStartingBalance);
    
    // 檢查餘額是否足夠
    if (currentBalance < auction.winningBid) {
      toast({
        title: "餘額不足",
        description: `${auction.winner} 的錢包餘額為 ${Math.max(0, currentBalance)} 鑽石，不足以支付 ${auction.winningBid} 鑽石，請使用其他方式付款`,
        variant: "destructive",
      });
      return;
    }
    
    // 餘額足夠，進行扣款
    const winnerDeductTransaction = {
      id: Date.now() + Math.random(),
      type: "支出",
      amount: -auction.winningBid,
      reason: `得標扣款：${auction.itemName}`,
      date: new Date().toLocaleString('zh-TW'),
      category: "得標扣款",
      participant: auction.winner,
      itemName: auction.itemName,
      itemLevel: auction.itemLevel
    };
    existingTransactions.unshift(winnerDeductTransaction);
    localStorage.setItem('walletTransactions', JSON.stringify(existingTransactions));
    
    // 完成分配
    completeDistribution(auction);
    
    toast({
      title: "錢包付款完成",
      description: `${auction.winner} 已使用錢包餘額付款 ${auction.winningBid} 鑽石，餘額剩餘 ${Math.max(0, currentBalance - auction.winningBid)} 鑽石，分鑽已完成`,
    });
  };

  const handleGamePayment = (auction) => {
    // 不扣除得標者錢包金額，直接完成分配
    completeDistribution(auction);
    
    toast({
      title: "遊戲內付款完成", 
      description: `${auction.winner} 使用遊戲內或其他方式付款，分鑽已完成`,
    });
  };

  const handleRelisting = (auction) => {
    // 將流標商品重新加入等待上架列表
    const existingPending = JSON.parse(localStorage.getItem('pendingTreasures') || '[]');
    const relistItem = {
      ...auction,
      id: Date.now(), // 生成新的ID
      status: "等待上架",
      registeredAt: new Date().toLocaleString('zh-TW'),
      registeredBy: profile?.username || "管理員",
      teamId: team?.id // 確保設置正確的團隊ID
    };
    
    const updatedPending = [relistItem, ...existingPending];
    localStorage.setItem('pendingTreasures', JSON.stringify(updatedPending));
    
    // 從已完成交易中移除
    const updatedCompleted = completedAuctions.filter(item => item.id !== auction.id);
    setCompletedAuctions(updatedCompleted);
    localStorage.setItem('completedTransactions', JSON.stringify(updatedCompleted));
    
    toast({
      title: "重新上架成功",
      description: `${auction.itemName} 已移至等待上架列表`,
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
                📊 交易完成
              </h1>
              <p className="text-treasure-gold/80">
                {team?.name} | {user?.username}
              </p>
            </div>
          </div>
          
          {completedAuctions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompletedTransactions}
              className="text-red-400 border-red-400/50 hover:bg-red-400/10"
            >
              清除記錄
            </Button>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-treasure-gold/20 rounded-lg">
                  <Trophy className="w-5 h-5 text-treasure-gold" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">已完成拍賣</p>
                  <p className="text-xl font-bold text-treasure-gold">{completedAuctions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-treasure-amber/20 rounded-lg">
                  <Users className="w-5 h-5 text-treasure-amber" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">總交易鑽石</p>
                  <p className="text-xl font-bold text-treasure-gold">
                    {completedAuctions.reduce((total, auction) => total + (auction.winningBid || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-treasure-purple/20 rounded-lg">
                  <Clock className="w-5 h-5 text-treasure-purple" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">最高成交價</p>
                  <p className="text-xl font-bold text-treasure-gold">
                    {completedAuctions.length > 0 ? 
                      Math.max(...completedAuctions.map(a => a.winningBid || 0)) : 0} 鑽石
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completed Auctions List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {completedAuctions.map((auction) => (
            <Card key={auction.id} className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
              <CardHeader className="pb-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-treasure-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-2xl">{getItemLevelIcon(auction.itemLevel)}</span>
                    <div>
                      <div className="text-lg text-treasure-gold">{auction.itemName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getItemLevelColor(auction.itemLevel)}`}>
                          {auction.itemLevel}
                        </Badge>
                        <Badge className="text-xs bg-treasure-surface/50 text-treasure-gold border-treasure-border">
                          {auction.bidType === 'open' ? (
                            <><Eye className="w-3 h-3 mr-1" />明標</>
                          ) : (
                            <><EyeOff className="w-3 h-3 mr-1" />暗標</>
                          )}
                        </Badge>
                        <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                          已完成
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
                    <span>BOSS：{auction.bossName}</span>
                  </div>
                  <div>伺服器：{auction.serverName}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-treasure-gold/70">起標價格</div>
                    <div className="font-semibold text-treasure-gold">{auction.startingPrice} 鑽石</div>
                  </div>
                  <div>
                    <div className="text-treasure-gold/70">成交價格</div>
                    <div className="font-semibold text-treasure-amber">
                      {auction.winningBid || 0} 鑽石
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-treasure-gold/70">得標者</div>
                    <div className="font-semibold text-green-400">{auction.winner}</div>
                  </div>
                  <div>
                    <div className="text-treasure-gold/70">完成時間</div>
                    <div className="font-semibold text-treasure-gold/80">{auction.completedAt}</div>
                  </div>
                </div>

                {/* Bidding History for Open Auctions */}
                {auction.bidType === 'open' && auction.bidHistory && auction.bidHistory.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-treasure-gold/70">競標記錄</div>
                    <ScrollArea className="h-24 w-full">
                      <div className="space-y-1">
                        {auction.bidHistory.map((bid, index) => (
                          <div key={index} className="flex justify-between text-xs bg-treasure-surface/30 rounded p-2">
                            <span className="text-treasure-gold/70">{bid.bidder}</span>
                            <span className="text-treasure-amber">{bid.amount} 鑽石</span>
                            <span className="text-treasure-gold/50">{bid.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-treasure-gold/60 pt-2 border-t border-treasure-border">
                  <span>參與競標：{auction.bidderCount || 0} 人</span>
                  <span>拍賣類型：{auction.bidType === 'open' ? '公開競標' : '密封競標'}</span>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-treasure-border">
                  {auction.winner !== '無人競標' && auction.winningBid > 0 ? (
                    // 有得標者：顯示入帳按鈕或付款選擇按鈕或已處理狀態
                    auction.isProcessed ? (
                      <Button 
                        disabled 
                        className="w-full bg-green-500/20 text-green-400 cursor-not-allowed"
                      >
                        ✅ 已完成分鑽
                      </Button>
                    ) : paymentSelectionMode.has(auction.id) ? (
                      // 顯示付款方式選擇按鈕
                      <div className="space-y-3">
                        <div className="text-sm text-treasure-gold/70 text-center">
                          請選擇 <span className="text-treasure-gold font-medium">{auction.winner}</span> 的付款方式：
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <Button 
                            onClick={() => handleWalletPayment(auction)}
                            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 to-blue-400 text-white"
                          >
                            <Wallet className="w-4 h-4 mr-2" />
                            使用該成員錢包餘額付款
                          </Button>
                          <Button 
                            onClick={() => handleGamePayment(auction)}
                            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 to-purple-400 text-white"
                          >
                            <Gamepad2 className="w-4 h-4 mr-2" />
                            使用遊戲內或其他方式付款
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleAccountEntry(auction)}
                        className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 to-green-400 text-white"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        鑽石入帳處理
                      </Button>
                    )
                  ) : (
                    // 流標商品：顯示重新上架按鈕
                    <Button 
                      onClick={() => handleRelisting(auction)}
                      className="w-full bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      重新上架
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {completedAuctions.length === 0 && (
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border text-center p-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-treasure-gold/30" />
            <h3 className="text-xl font-semibold text-treasure-gold mb-2">
              尚無已完成的交易
            </h3>
            <p className="text-treasure-gold/60 mb-4">
              當拍賣時間結束後，已完成的交易會顯示在這裡。
            </p>
            <Button
              onClick={() => navigate("/auction")}
              className="bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue"
            >
              前往拍賣場
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompletedTransactions;