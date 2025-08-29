import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Coins, TrendingUp, TrendingDown, Calendar, Award, Send, ArrowDownToLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Wallet = () => {
  const navigate = useNavigate();
  const { profile, team, user } = useCustomAuth();
  const { toast } = useToast();

  const [diamondData, setDiamondData] = useState({
    currentBalance: 0,
    totalEarned: 0,
    totalSpent: 0,
    rank: 3,
    totalMembers: 15
  });

  // Transfer dialog state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  
  // Withdraw dialog state
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawImage, setWithdrawImage] = useState<File | null>(null);

  // Team members for transfer
  const [teamMembers, setTeamMembers] = useState<string[]>([]);

  // Load actual transaction history from localStorage
  const [transactions, setTransactions] = useState([]);
  
  // 添加強制刷新狀態
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Fetch diamond balance and data
  useEffect(() => {
    // Currently using localStorage for wallet management
  }, [profile?.id]);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!team?.id) return;
      
      try {
        const { data: members, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('team_id', team.id);
        
        if (error) {
          console.error('Failed to fetch team members:', error);
          return;
        }
        
        setTeamMembers(members?.map(member => member.username) || []);
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };

    fetchTeamMembers();
  }, [team?.id]);
  
  // 監聽 localStorage 變化並重新計算餘額
  const updateWalletData = () => {
    if (!profile?.username && !user?.username) return;
    
    // 使用當前用戶名稱（優先使用 profile.username，否則使用 user.username）
    const currentUsername = profile?.username || user?.username;
    
    // Load transactions from localStorage and filter for current user
    const walletTransactions = JSON.parse(localStorage.getItem('walletTransactions') || '[]');
    const allTransactions = walletTransactions.filter(transaction => 
      transaction.participant === currentUsername
    );
    
    // Sort transactions by date (newest first)
    const sortedTransactions = allTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setTransactions(sortedTransactions);
    
    // Get user's starting balance from localStorage, default to 0
    const userStartingBalanceKey = `userStartingBalance_${currentUsername}`;
    const userStartingBalance = parseInt(localStorage.getItem(userStartingBalanceKey) || '0');
    
    // Calculate current balance from all transactions
    const currentBalance = allTransactions.reduce((total, transaction) => {
      return total + (transaction.amount || 0);
    }, userStartingBalance); // Start with user's individual starting balance
    
    const totalEarned = allTransactions
      .filter(t => (t.amount || 0) > 0)
      .reduce((sum, t) => sum + (t.amount || 0), userStartingBalance);
    
    const totalSpent = Math.abs(allTransactions
      .filter(t => (t.amount || 0) < 0)
      .reduce((sum, t) => sum + (t.amount || 0), 0));
    
    // Update diamond data with calculated values
    setDiamondData(prev => ({
      ...prev,
      currentBalance: currentBalance, // Allow any balance including negative
      totalEarned,
      totalSpent
    }));
  };

  useEffect(() => {
    updateWalletData();
  }, [profile?.username, user?.username, refreshTrigger]);

  // 監聽 storage 事件來實現跨頁面同步
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'walletTransactions') {
        updateWalletData();
      }
    };

    // 監聽自定義事件（用於同一頁面內的更新）
    const handleWalletUpdate = () => {
      updateWalletData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('walletUpdate', handleWalletUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('walletUpdate', handleWalletUpdate);
    };
  }, [profile?.username, user?.username]);

  const getTransactionColor = (type: string) => {
    return type === "獲得" ? "text-green-600" : "text-red-600";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "副本獎勵": return "bg-blue-100 text-blue-800";
      case "拍賣": return "bg-purple-100 text-purple-800";
      case "簽到獎勵": return "bg-green-100 text-green-800";
      case "分鑽收益": return "bg-amber-100 text-amber-800";
      case "轉帳": return "bg-orange-100 text-orange-800";
      case "提領": return "bg-red-100 text-red-800";
      case "團隊補助": return "bg-teal-100 text-teal-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || !transferTarget) {
      toast({
        title: "轉帳失敗",
        description: "請填寫轉帳金額和目標用戶",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount <= 0) {
      toast({
        title: "轉帳失敗",
        description: "轉帳金額無效",
        variant: "destructive",
      });
      return;
    }

    if (diamondData.currentBalance <= 0) {
      toast({
        title: "轉帳失敗",
        description: "餘額不足，錢包餘額必須為正數才能轉帳",
        variant: "destructive",
      });
      return;
    }

    if (amount > diamondData.currentBalance) {
      toast({
        title: "轉帳失敗",
        description: "轉帳金額超過可用餘額",
        variant: "destructive",
      });
      return;
    }

    try {
      // 獲取轉帳目標的profile_id
      const { data: targetProfile, error: targetError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', transferTarget)
        .eq('team_id', team?.id)
        .single();

      if (targetError || !targetProfile) {
        toast({
          title: "轉帳失敗",
          description: "找不到轉帳目標用戶",
          variant: "destructive",
        });
        return;
      }

      // 創建轉帳記錄 (發送方 - 扣除)
      const { error: senderRecordError } = await supabase
        .from('diamond_records')
        .insert({
          profile_id: profile?.id,
          points: -amount,
          reason: `轉帳給 ${transferTarget}`,
          created_by: profile?.id
        });

      if (senderRecordError) {
        console.error('Failed to create sender record:', senderRecordError);
        toast({
          title: "轉帳失敗",
          description: "無法創建轉帳記錄",
          variant: "destructive",
        });
        return;
      }

      // 創建轉帳記錄 (接收方 - 增加)
      const { error: receiverRecordError } = await supabase
        .from('diamond_records')
        .insert({
          profile_id: targetProfile.id,
          points: amount,
          reason: `收到來自 ${profile?.username} 的轉帳`,
          created_by: profile?.id
        });

      if (receiverRecordError) {
        console.error('Failed to create receiver record:', receiverRecordError);
      }

      // 更新本地狀態
      // 創建本地交易記錄
      const currentUsername = profile?.username || user?.username;
      const transferRecord = {
        id: Date.now(),
        type: "支出",
        amount: -amount,
        reason: `轉帳給 ${transferTarget}`,
        date: new Date().toLocaleString('zh-TW'),
        category: "轉帳",
        participant: currentUsername
      };

      const existingTransactions = JSON.parse(localStorage.getItem('walletTransactions') || '[]');
      existingTransactions.unshift(transferRecord);
      localStorage.setItem('walletTransactions', JSON.stringify(existingTransactions));
      
      // Recalculate balance after transaction
      const updatedTransactions = existingTransactions.filter(transaction => 
        transaction.participant === currentUsername
      );
      const userStartingBalanceKey = `userStartingBalance_${currentUsername}`;
      const userStartingBalance = parseInt(localStorage.getItem(userStartingBalanceKey) || '0');
      const calculatedBalance = updatedTransactions.reduce((total, transaction) => {
        return total + (transaction.amount || 0);
      }, userStartingBalance);
      
      setDiamondData(prev => ({
        ...prev,
        currentBalance: calculatedBalance
      }));
      setTransactions([transferRecord, ...transactions]);

      toast({
        title: "轉帳成功",
        description: `已成功轉帳 ${amount} 鑽石給 ${transferTarget}`,
      });

      setTransferAmount('');
      setTransferTarget('');
      setIsTransferOpen(false);
    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "轉帳失敗",
        description: "系統錯誤，請稍後重試",
        variant: "destructive",
      });
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) {
      toast({
        title: "無效金額",
        description: "請輸入有效的提領金額",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0) {
      toast({
        title: "無效金額",
        description: "請輸入有效的提領金額",
        variant: "destructive",
      });
      return;
    }

    if (amount > diamondData.currentBalance) {
      toast({
        title: "餘額不足",
        description: "提領金額不能超過目前餘額",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!profile?.id) {
        toast({
          title: "用戶資料錯誤",
          description: "無法獲取用戶資料，請重新登入",
          variant: "destructive",
        });
        return;
      }

      // 直接進行本地錢包扣款和審核記錄創建

      // 創建本地交易記錄
      const currentUsername = profile?.username || user?.username;
      const withdrawRecord = {
        id: Date.now(),
        type: "支出",
        amount: -amount,
        reason: "鑽石提領",
        date: new Date().toLocaleString('zh-TW'),
        category: "提領",
        participant: currentUsername
      };

      const existingTransactions = JSON.parse(localStorage.getItem('walletTransactions') || '[]');
      existingTransactions.unshift(withdrawRecord);
      localStorage.setItem('walletTransactions', JSON.stringify(existingTransactions));
      
      // Recalculate balance after transaction
      const updatedTransactions = existingTransactions.filter(transaction => 
        transaction.participant === currentUsername
      );
      const userStartingBalanceKey = `userStartingBalance_${currentUsername}`;
      const userStartingBalance = parseInt(localStorage.getItem(userStartingBalanceKey) || '0');
      const calculatedBalance = updatedTransactions.reduce((total, transaction) => {
        return total + (transaction.amount || 0);
      }, userStartingBalance);
      
      setDiamondData(prev => ({
        ...prev,
        currentBalance: calculatedBalance
      }));
      setTransactions([withdrawRecord, ...transactions]);

      // 創建審核申請記錄
      const auditRecord = {
        id: Date.now(),
        type: 'withdrawal',
        username: profile?.username,
        amount: amount,
        reason: "鑽石提領申請", 
        status: 'pending',
        submitDate: new Date().toLocaleString('zh-TW'),
        certificateImage: withdrawImage ? URL.createObjectURL(withdrawImage) : null,
        certificateImageFile: withdrawImage // 保存文件引用
      };

      // 保存審核記錄
      const existingAudits = JSON.parse(localStorage.getItem('auditRecords') || '[]');
      existingAudits.unshift(auditRecord);
      localStorage.setItem('auditRecords', JSON.stringify(existingAudits));

      toast({
        title: "提領申請成功",
        description: `已申請提領 ${amount} 鑽石，鑽石已扣除，等待審核中`,
      });

      setWithdrawAmount('');
      setWithdrawImage(null);
      setIsWithdrawOpen(false);
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "提領失敗",
        description: "處理提領時發生錯誤，請稍後再試",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
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
            <h1 className="text-3xl font-bold">💰 我的錢包</h1>
            <p className="text-slate-300">
              {team?.name} | {user?.username}
            </p>
          </div>
        </div>

        {/* Diamond Overview */}
        <div className="mb-6">
          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white w-full max-w-sm mx-auto">
            <CardContent className="p-6 text-center">
              <Coins className="w-12 h-12 mx-auto mb-3" />
              <div className="text-3xl font-bold mb-2">{diamondData.currentBalance}</div>
              <div className="text-sm opacity-90">當前鑽石餘額</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Transfer Dialog */}
          <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
            <DialogTrigger asChild>
              <Button className="h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                <Send className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">轉帳</div>
                  <div className="text-sm opacity-90">轉帳給團隊成員</div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-treasure-surface/95 backdrop-blur-sm border-treasure-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-treasure-gold">
                  <Send className="w-5 h-5" />
                  鑽石轉帳
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="transferAmount" className="text-treasure-gold">轉帳金額</Label>
                  <Input
                    id="transferAmount"
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="請輸入轉帳金額"
                    max={diamondData.currentBalance}
                    className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50 focus:border-treasure-gold"
                  />
                  <div className="text-sm text-treasure-gold/70 mt-1">
                    可用餘額：{diamondData.currentBalance} 鑽石
                  </div>
                </div>
                
                <div>
                  <Label className="text-treasure-gold">轉帳對象</Label>
                  <Select value={transferTarget} onValueChange={setTransferTarget}>
                    <SelectTrigger className="bg-treasure-surface/50 border-treasure-border text-white">
                      <SelectValue placeholder="選擇轉帳對象" />
                    </SelectTrigger>
                    <SelectContent className="bg-treasure-surface border-treasure-border z-50">
                      {teamMembers.filter(member => member !== profile?.username).map((member) => (
                        <SelectItem key={member} value={member} className="text-treasure-gold">
                          {member}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1 border-treasure-border text-treasure-gold hover:bg-treasure-surface/30" onClick={() => setIsTransferOpen(false)}>
                    取消
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue" onClick={handleTransfer}>
                    確認轉帳
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Withdraw Dialog */}
          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <Button className="h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                <ArrowDownToLine className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">提領</div>
                  <div className="text-sm opacity-90">提領鑽石到外部帳戶</div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-treasure-surface/95 backdrop-blur-sm border-treasure-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-treasure-gold">
                  <ArrowDownToLine className="w-5 h-5" />
                  鑽石提領
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="withdrawAmount" className="text-treasure-gold">提領金額</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="請輸入提領金額"
                    max={diamondData.currentBalance}
                    className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50 focus:border-treasure-gold"
                  />
                  <div className="text-sm text-treasure-gold/70 mt-1">
                    可提領餘額：{diamondData.currentBalance} 鑽石
                  </div>
                </div>
                
                <div>
                  <Label className="text-treasure-gold">提領憑證圖片</Label>
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setWithdrawImage(file);
                      }}
                      className="bg-treasure-surface/50 border-treasure-border text-white file:bg-treasure-gold/20 file:text-treasure-gold file:border-treasure-border"
                    />
                    {withdrawImage && (
                      <div className="bg-treasure-surface/30 border border-treasure-border rounded-lg p-3">
                        <div className="text-sm text-treasure-gold">
                          已選擇檔案: {withdrawImage.name}
                        </div>
                        <div className="text-xs text-treasure-gold/70 mt-1">
                          大小: {(withdrawImage.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-treasure-gold/10 border border-treasure-border rounded-lg p-3">
                  <div className="text-sm text-treasure-gold/90">
                    <div className="font-medium mb-1 text-treasure-gold">提領說明：</div>
                    <div>• 上架後請上傳圖片</div>
                    <div>• 按下申請提領後錢包餘額會直接扣除</div>
                    <div>• 最低提領金額：100 鑽石</div>
                    <div>• 申請後請等會計處理</div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1 border-treasure-border text-treasure-gold hover:bg-treasure-surface/30" onClick={() => setIsWithdrawOpen(false)}>
                    取消
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue" onClick={handleWithdraw}>
                    申請提領
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Transaction History */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              鑽石交易明細
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium">{transaction.reason}</span>
                      <Badge className={getCategoryColor(transaction.category)}>
                        {transaction.category}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">{transaction.date}</div>
                  </div>
                  <div className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} 鑽石
                  </div>
                </div>
              ))}
            </div>

            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>尚無交易紀錄</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;