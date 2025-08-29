import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Gavel, Users, Clock, Trophy, Eye, EyeOff, Crown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import SubscriptionProtectedRoute from "@/components/SubscriptionProtectedRoute";

const Auction = () => {
  const navigate = useNavigate();
  const { profile, team, user } = useCustomAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isUserLocked, setIsUserLocked] = useState(false);

  // Check if current user is locked
  useEffect(() => {
    const checkUserLockStatus = () => {
      if (profile?.id) {
        const lockedMembers = JSON.parse(localStorage.getItem('lockedMembers') || '[]');
        setIsUserLocked(lockedMembers.includes(profile.id));
      }
    };

    checkUserLockStatus();
    
    // Listen for changes in lock status
    const handleStorageChange = (e) => {
      if (e.key === 'lockedMembers') {
        checkUserLockStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [profile?.id]);

  // Load auctions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('activeAuctions');
    if (saved) {
      const auctionData = JSON.parse(saved);
      // Process auctions while preserving existing endTime
      const processedAuctions = auctionData.map(auction => ({
        ...auction,
        // Keep existing values or set defaults only for new auctions
        currentPrice: auction.currentPrice || parseFloat(auction.startingPrice),
        bidHistory: auction.bidHistory || (auction.bidType === 'open' ? [] : []),
        bidderCount: auction.bidderCount || 0,
        lastBidder: auction.lastBidder || null,
        // Only set endTime if it doesn't exist (new auction) or convert string to Date object
        endTime: auction.endTime ? new Date(auction.endTime) : new Date(Date.now() + (auction.duration === '2min' ? 2 * 60 * 1000 : 2 * 60 * 60 * 1000))
      }));
      setAuctions(processedAuctions);
    }
  }, []);

  // Check for expired auctions and move to completed transactions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now); // Update current time to trigger re-render of countdown
      
      const activeAuctions = auctions.filter(auction => {
        const timeLeft = auction.endTime.getTime() - now.getTime();
        return timeLeft > 0;
      });
      
      const expiredAuctions = auctions.filter(auction => {
        const timeLeft = auction.endTime.getTime() - now.getTime();
        return timeLeft <= 0;
      });

      if (expiredAuctions.length > 0) {
        // Separate auctions with bids and without bids
        // For sealed auctions, check bidderCount since bidHistory is not maintained
        // For open auctions, check bidHistory
        const auctionsWithBids = expiredAuctions.filter(auction => {
          if (auction.bidType === 'sealed') {
            // For sealed auctions, check if there were any bidders
            return auction.bidderCount > 0;
          } else {
            // For open auctions, check bid history
            return auction.bidHistory.length > 0;
          }
        });
        
        const auctionsWithoutBids = expiredAuctions.filter(auction => {
          if (auction.bidType === 'sealed') {
            // For sealed auctions, check if there were no bidders
            return auction.bidderCount === 0;
          } else {
            // For open auctions, check bid history
            return auction.bidHistory.length === 0;
          }
        });
        
        // Move auctions with bids to completed transactions
        if (auctionsWithBids.length > 0) {
          // Load basic settings for commission rates
          const basicSettings = JSON.parse(localStorage.getItem('basicSettings') || '{}');
          
          const existingCompleted = JSON.parse(localStorage.getItem('completedTransactions') || '[]');
          const completedAuctions = auctionsWithBids.map(auction => {
            // Get commission rate based on item level
            let commissionRate = basicSettings.auctionCommissionRate || 10;
            
            console.log("🔍 拍賣抽成計算:", {
              itemName: auction.itemName,
              itemLevel: auction.itemLevel,
              basicSettings: {
                auctionCommissionRate: basicSettings.auctionCommissionRate,
                auctionCommissionRateHero: basicSettings.auctionCommissionRateHero,
                auctionCommissionRateLegendary: basicSettings.auctionCommissionRateLegendary
              }
            });
            
            switch (auction.itemLevel) {
              case '稀有':
                commissionRate = basicSettings.auctionCommissionRateRare || basicSettings.auctionCommissionRate || 10;
                break;
              case '英雄':
                commissionRate = basicSettings.auctionCommissionRateHero || 12;
                break;
              case '傳說':
                commissionRate = basicSettings.auctionCommissionRateLegendary || 15;
                break;
              default:
                commissionRate = basicSettings.auctionCommissionRate || 10;
            }
            
            console.log("✅ 最終抽成率:", {
              itemLevel: auction.itemLevel,
              commissionRate: commissionRate,
              winningBid: auction.currentPrice
            });
            
            const winningBid = auction.currentPrice;
            const commissionAmount = Math.round(winningBid * (commissionRate / 100));
            const finalAmount = winningBid - commissionAmount;
            
            return {
              ...auction,
              status: 'completed',
              completedAt: new Date().toLocaleString('zh-TW'),
              winningBid: winningBid,
              winner: auction.bidType === 'sealed' 
                ? (auction.lastBidder || '匿名用戶')
                : auction.bidHistory[auction.bidHistory.length - 1]?.bidder || '匿名用戶',
              commissionRate: commissionRate,
              commissionAmount: commissionAmount,
              finalAmount: finalAmount
            };
          });
          
          // Calculate total commission for public fund
          const totalCommission = completedAuctions.reduce((total, auction) => total + auction.commissionAmount, 0);
          
          if (totalCommission > 0) {
            // Update public fund
            const publicFundData = JSON.parse(localStorage.getItem('publicFundData') || '{}');
            const currentBalance = publicFundData.balance || 0;
            publicFundData.balance = currentBalance + totalCommission;
            
            // Record public fund transaction
            const publicFundTransactions = JSON.parse(localStorage.getItem('publicFundTransactions') || '[]');
            const commissionTransaction = {
              id: Date.now() + Math.random(),
              type: "收入",
              amount: totalCommission,
              reason: `拍賣手續費收入 (${completedAuctions.length} 筆拍賣)`,
              date: new Date().toLocaleString('zh-TW'),
              category: "拍賣手續費"
            };
            publicFundTransactions.push(commissionTransaction);
            
            localStorage.setItem('publicFundData', JSON.stringify(publicFundData));
            localStorage.setItem('publicFundTransactions', JSON.stringify(publicFundTransactions));
            
            // Trigger public fund update
            window.dispatchEvent(new Event('publicFundUpdate'));
          }
          
          localStorage.setItem('completedTransactions', JSON.stringify([...existingCompleted, ...completedAuctions]));
        }
        
        // Move auctions without bids to unsold items
        if (auctionsWithoutBids.length > 0) {
          const existingUnsold = JSON.parse(localStorage.getItem('unsoldItems') || '[]');
          const unsoldAuctions = auctionsWithoutBids.map(auction => ({
            ...auction,
            status: 'unsold',
            completedAt: new Date().toLocaleString('zh-TW'),
            winningBid: 0,
            winner: '無人競標'
          }));
          
          localStorage.setItem('unsoldItems', JSON.stringify([...existingUnsold, ...unsoldAuctions]));
        }
        
        localStorage.setItem('activeAuctions', JSON.stringify(activeAuctions));
        
        // Update state
        setAuctions(activeAuctions);
        
        // Show notifications for completed auctions
        auctionsWithBids.forEach(auction => {
          const basicSettings = JSON.parse(localStorage.getItem('basicSettings') || '{}');
          
          let commissionRate = basicSettings.auctionCommissionRate || 10;
          
          switch (auction.itemLevel) {
            case '稀有':
              commissionRate = basicSettings.auctionCommissionRateRare || basicSettings.auctionCommissionRate || 10;
              break;
            case '英雄':
              commissionRate = basicSettings.auctionCommissionRateHero || 12;
              break;
            case '傳說':
              commissionRate = basicSettings.auctionCommissionRateLegendary || 15;
              break;
            default:
              commissionRate = basicSettings.auctionCommissionRate || 10;
          }
          
          const commissionAmount = Math.round(auction.currentPrice * (commissionRate / 100));
          
          toast({
            title: "拍賣結束",
            description: `${auction.itemName} 以 ${auction.currentPrice} 鑽石成交，手續費 ${commissionAmount} 鑽石 (${commissionRate}%) 已轉入公基金`,
          });
        });
        
        // Show notifications for unsold auctions
        auctionsWithoutBids.forEach(auction => {
          toast({
            title: "拍賣流標",
            description: `${auction.itemName} 無人競標，已移至流標區`,
          });
        });
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [auctions, toast]);

  const formatTimeLeft = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return "已結束";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}小時${minutes}分鐘`;
    if (minutes > 0) return `${minutes}分${seconds}秒`;
    return `${seconds}秒`;
  };

  const isAuctionEnded = (endTime: Date) => {
    const now = new Date();
    return endTime.getTime() - now.getTime() <= 0;
  };

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

  const handleBid = (auction) => {
    // Check if user is locked
    if (isUserLocked) {
      toast({
        title: "帳號已鎖定",
        description: "您的帳號已被管理員鎖定，無法參與拍賣",
        variant: "destructive",
      });
      return;
    }

    if (isAuctionEnded(auction.endTime)) {
      toast({
        title: "拍賣已結束",
        description: "此拍賣已經結束，無法再出價",
        variant: "destructive",
      });
      return;
    }
    setSelectedAuction(auction);
    setBidAmount(''); // 清空輸入框，讓用戶自行輸入
  };

  const submitBid = () => {
    if (!bidAmount || parseFloat(bidAmount) <= selectedAuction.currentPrice) {
      toast({
        title: "出價無效",
        description: `出價必須高於目前價格 ${selectedAuction.currentPrice} 鑽石`,
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    let extendedEndTime = selectedAuction.endTime;

    // Check bid extension mechanism
    if (selectedAuction.extensionEnabled) {
      const timeUntilEnd = selectedAuction.endTime.getTime() - now.getTime();
      const extensionTriggerTime = parseInt(selectedAuction.extensionMinutes || '10') * 60 * 1000; // Convert to milliseconds
      
      // If bid is placed within the extension trigger time, extend the auction
      if (timeUntilEnd <= extensionTriggerTime) {
        const extensionDuration = parseInt(selectedAuction.extensionTime || '10') * 60 * 1000; // Convert to milliseconds
        extendedEndTime = new Date(selectedAuction.endTime.getTime() + extensionDuration);
        
        toast({
          title: "拍賣時間延長",
          description: `由於在結束前${selectedAuction.extensionMinutes}分鐘內有新出價，拍賣時間延長${selectedAuction.extensionTime}分鐘`,
        });
      }
    }

    // Update auction with new bid
    const updatedAuctions = auctions.map(auction => {
      if (auction.id === selectedAuction.id) {
        const newBid = {
          bidder: user?.username || "我",
          amount: parseFloat(bidAmount),
          timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
        };
        
        return {
          ...auction,
          currentPrice: parseFloat(bidAmount),
          bidHistory: auction.bidType === 'open' ? [...auction.bidHistory, newBid] : auction.bidHistory,
          bidderCount: auction.bidderCount + 1,
          endTime: extendedEndTime, // Update end time if extended
          // For sealed auctions, track the latest bidder as the current highest bidder
          lastBidder: auction.bidType === 'sealed' ? (user?.username || "匿名用戶") : auction.lastBidder
        };
      }
      return auction;
    });

    setAuctions(updatedAuctions);
    localStorage.setItem('activeAuctions', JSON.stringify(updatedAuctions));
    
    toast({
      title: "出價成功",
      description: `成功出價 ${bidAmount} 鑽石`,
    });
    
    setSelectedAuction(null);
    setBidAmount('');
  };

  const forceEndAuction = (auction) => {
    // 將拍賣物品強制移動到流標區
    const existingUnsold = JSON.parse(localStorage.getItem('unsoldItems') || '[]');
    const forcedUnsoldAuction = {
      ...auction,
      status: 'unsold',
      completedAt: new Date().toLocaleString('zh-TW'),
      winningBid: 0,
      winner: '管理員強制結束',
      forcedEnd: true // 標記為強制結束
    };
    
    localStorage.setItem('unsoldItems', JSON.stringify([...existingUnsold, forcedUnsoldAuction]));
    
    // 從活躍拍賣中移除
    const updatedAuctions = auctions.filter(a => a.id !== auction.id);
    setAuctions(updatedAuctions);
    localStorage.setItem('activeAuctions', JSON.stringify(updatedAuctions));
    
    toast({
      title: "拍賣已強制結束",
      description: `${auction.itemName} 已被強制結束並移至流標區`,
    });
  };

  return (
    <SubscriptionProtectedRoute requiredDays={3}>
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
              🏛️ 拍賣場
            </h1>
            <p className="text-treasure-gold/80">
              {team?.name} | {user?.username}
            </p>
          </div>
        </div>

        {/* User Locked Warning */}
        {isUserLocked && (
          <Card className="bg-red-900/20 border-red-600/50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Eye className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-red-300 font-medium">帳號已鎖定</p>
                  <p className="text-red-400/80 text-sm">您的帳號已被管理員鎖定，暫時無法參與拍賣競標</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-treasure-gold/20 rounded-lg">
                  <Gavel className="w-5 h-5 text-treasure-gold" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">進行中拍賣</p>
                  <p className="text-xl font-bold text-treasure-gold">{auctions.length}</p>
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
                  <p className="text-sm text-treasure-gold/70">參與競標者</p>
                  <p className="text-xl font-bold text-treasure-gold">
                    {auctions.reduce((total, auction) => total + auction.bidderCount, 0)}
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
                  <p className="text-sm text-treasure-gold/70">最快結束</p>
                  <p className="text-xl font-bold text-treasure-gold">
                    {auctions.length > 0 ? formatTimeLeft(auctions[0]?.endTime) : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auction List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <Card key={auction.id} className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border hover:bg-treasure-surface/70 transition-all duration-200">
              <CardHeader className="pb-3 bg-gradient-to-r from-treasure-gold-dark/10 to-treasure-amber/10 border-b border-treasure-border">
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
                    <div className="text-treasure-gold/70">
                      {auction.bidType === 'sealed' ? '暗標進行中' : '目前價格'}
                    </div>
                    <div className="font-semibold text-treasure-amber">
                      {auction.bidType === 'sealed' ? '***' : `${auction.currentPrice} 鑽石`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-treasure-gold/50" />
                    <span className="text-treasure-gold/70">{auction.bidderCount} 人競標</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-treasure-gold/50" />
                    <span className="text-treasure-gold/70">{formatTimeLeft(auction.endTime)}</span>
                  </div>
                </div>

                {/* Bidding History for Open Auctions */}
                {auction.bidType === 'open' && auction.bidHistory.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-treasure-gold/70">出價記錄</div>
                    <ScrollArea className="h-20 w-full">
                      <div className="space-y-1">
                        {auction.bidHistory.slice(-3).map((bid, index) => (
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
                
                <div className="space-y-2">
                  <Button 
                    className={`w-full ${
                      isAuctionEnded(auction.endTime) || isUserLocked
                        ? 'bg-gray-500/50 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber'
                    } text-treasure-deep-blue`}
                    onClick={() => handleBid(auction)}
                    disabled={isAuctionEnded(auction.endTime) || isUserLocked}
                  >
                    <Gavel className="w-4 h-4 mr-2" />
                    {isUserLocked ? '帳號已鎖定' : isAuctionEnded(auction.endTime) ? '拍賣已結束' : '出價競標'}
                  </Button>
                  
                  {/* 強制結束拍賣按紐 - 只有拍賣員和管理者可見 */}
                  {(hasPermission('pending') || hasPermission('account-settings')) && !isAuctionEnded(auction.endTime) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="w-full text-red-400 border-red-400/50 hover:bg-red-400/10 hover:text-red-300"
                        >
                          <X className="w-4 h-4 mr-2" />
                          強制結束拍賣
                        </Button>
                      </AlertDialogTrigger>
                      
                      <AlertDialogContent className="max-w-md bg-treasure-surface/95 backdrop-blur-sm border-treasure-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-red-400 text-xl">
                            <X className="w-5 h-5 inline mr-2" />
                            強制結束拍賣
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-treasure-gold/70">
                            確定要強制結束「{auction.itemName}」的拍賣嗎？此操作將把物品移至流標區且無法撤銷。
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter className="space-x-2">
                          <AlertDialogCancel className="bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border-gray-500">
                            取消
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => forceEndAuction(auction)}
                            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 to-red-400 text-white"
                          >
                            確定結束
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {auctions.length === 0 && (
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border text-center p-12">
            <Gavel className="w-16 h-16 mx-auto mb-4 text-treasure-gold/30" />
            <h3 className="text-xl font-semibold text-treasure-gold mb-2">
              目前沒有進行中的拍賣
            </h3>
            <p className="text-treasure-gold/60">
              請到等待上架頁面將寶物上架至拍賣場。
            </p>
          </Card>
        )}

        {/* Bid Dialog */}
        <AlertDialog open={selectedAuction !== null} onOpenChange={(open) => !open && setSelectedAuction(null)}>
          <AlertDialogContent className="max-w-md bg-treasure-surface/95 backdrop-blur-sm border-treasure-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-treasure-gold text-xl">
                <Gavel className="w-5 h-5 inline mr-2" />
                出價競標
              </AlertDialogTitle>
              <AlertDialogDescription className="text-treasure-gold/70">
                {selectedAuction && `對 ${selectedAuction.itemName} 進行競標`}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              {selectedAuction && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-treasure-gold/70">目前價格：</span>
                    <span className="text-treasure-gold font-semibold">
                      {selectedAuction.bidType === 'sealed' ? '***' : `${selectedAuction.currentPrice} 鑽石`}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bidAmount" className="text-treasure-gold">出價金額</Label>
                    <Input
                      id="bidAmount"
                      type="number"
                      placeholder="輸入出價金額"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="bg-treasure-surface/50 border-treasure-border text-treasure-gold placeholder:text-treasure-gold/50"
                    />
                    <div className="text-xs text-treasure-gold/60">
                      最低出價：{selectedAuction.bidType === 'sealed' 
                        ? `${selectedAuction.startingPrice} 鑽石` 
                        : `${selectedAuction.currentPrice + 1} 鑽石`}
                    </div>
                  </div>
                </>
              )}
            </div>

            <AlertDialogFooter className="space-x-2">
              <AlertDialogCancel 
                onClick={() => setSelectedAuction(null)}
                className="bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border-gray-500"
              >
                取消
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={submitBid}
                className="bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue"
              >
                確定出價
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
    </SubscriptionProtectedRoute>
  );
};

export default Auction;