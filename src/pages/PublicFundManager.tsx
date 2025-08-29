import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Coins, TrendingUp, TrendingDown, Plus, Edit, Trash2, Calendar, DollarSign, PieChart, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useToast } from "@/hooks/use-toast";

interface PublicFundRecord {
  id: number;
  type: "收入" | "支出";
  amount: number;
  reason: string;
  description: string;
  date: string;
  category: string;
  createdBy: string;
}

const PublicFundManager = () => {
  const navigate = useNavigate();
  const { profile, team, user } = useCustomAuth();
  const { toast } = useToast();
  
  const [records, setRecords] = useState<PublicFundRecord[]>([]);
  const [balance, setBalance] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PublicFundRecord | null>(null);
  const [formData, setFormData] = useState({
    type: "收入" as "收入" | "支出",
    amount: "",
    reason: "",
    description: "",
    category: "拍賣抽成"
  });

  // 提領和增加對話框狀態
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    reason: ""
  });
  const [depositForm, setDepositForm] = useState({
    amount: "",
    reason: ""
  });

  useEffect(() => {
    // Load existing records from localStorage
    loadRecords();
    
    // Listen for public fund updates to refresh balance display
    const handlePublicFundUpdate = () => {
      loadRecords(); // This will trigger a re-render with updated balance
    };
    
    window.addEventListener('publicFundUpdate', handlePublicFundUpdate);
    return () => window.removeEventListener('publicFundUpdate', handlePublicFundUpdate);
  }, []);

  const loadRecords = () => {
    // 只載入手動的提領和增加記錄
    const savedRecords = JSON.parse(localStorage.getItem('publicFundRecords') || '[]');
    
    // 過濾只保留提領和增加類型的記錄
    const manualRecords = savedRecords.filter(record => 
      record.category === '公基金提領' || record.category === '公基金增加'
    );
    
    setRecords(manualRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    // 同時更新餘額狀態
    const publicFundData = JSON.parse(localStorage.getItem('publicFundData') || '{}');
    setBalance(publicFundData.balance || 0);
  };

  const resetForm = () => {
    setFormData({
      type: "收入",
      amount: "",
      reason: "",
      description: "",
      category: "拍賣抽成"
    });
    setEditingRecord(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.reason || !formData.description) {
      toast({
        title: "填寫錯誤",
        description: "請填寫所有必填欄位",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "金額錯誤",
        description: "請輸入有效的金額",
        variant: "destructive",
      });
      return;
    }

    const newRecord: PublicFundRecord = {
      id: editingRecord ? editingRecord.id : Date.now(),
      type: formData.type,
      amount: amount,
      reason: formData.reason,
      description: formData.description,
      date: new Date().toLocaleString('zh-TW'),
      category: formData.category,
      createdBy: profile?.username || user?.username || "管理員"
    };

    let updatedRecords;
    let savedRecords = JSON.parse(localStorage.getItem('publicFundRecords') || '[]');

    if (editingRecord) {
      // Update existing record (only if it's not from distributions)
      if (!editingRecord.id.toString().startsWith('dist_')) {
        updatedRecords = savedRecords.map(record => 
          record.id === editingRecord.id ? newRecord : record
        );
        localStorage.setItem('publicFundRecords', JSON.stringify(updatedRecords));
        
        toast({
          title: "更新成功",
          description: `記錄已更新`,
        });
      }
    } else {
      // Add new record
      savedRecords.unshift(newRecord);
      localStorage.setItem('publicFundRecords', JSON.stringify(savedRecords));
      
      toast({
        title: "新增成功",
        description: `已新增${formData.type}記錄`,
      });
    }

    loadRecords();
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (record: PublicFundRecord) => {
    // Don't allow editing auto-generated records
    if (record.id.toString().startsWith('dist_')) {
      toast({
        title: "無法編輯",
        description: "系統自動產生的記錄無法編輯",
        variant: "destructive",
      });
      return;
    }

    setEditingRecord(record);
    setFormData({
      type: record.type,
      amount: record.amount.toString(),
      reason: record.reason,
      description: record.description,
      category: record.category
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number | string) => {
    // Don't allow deleting auto-generated records
    if (id.toString().startsWith('dist_')) {
      toast({
        title: "無法刪除",
        description: "系統自動產生的記錄無法刪除",
        variant: "destructive",
      });
      return;
    }

    const savedRecords = JSON.parse(localStorage.getItem('publicFundRecords') || '[]');
    const updatedRecords = savedRecords.filter(record => record.id !== id);
    localStorage.setItem('publicFundRecords', JSON.stringify(updatedRecords));
    
    loadRecords();
    
    toast({
      title: "刪除成功",
      description: "記錄已刪除",
    });
  };

  const clearAllRecords = () => {
    localStorage.removeItem('publicFundRecords');
    loadRecords();
    toast({
      title: "清空成功",
      description: "所有手動新增的記錄已清空",
    });
  };

  // 處理提領
  const handleWithdraw = () => {
    if (!withdrawForm.amount || !withdrawForm.reason) {
      toast({
        title: "填寫錯誤",
        description: "請填寫提領金額和事由",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(withdrawForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "金額錯誤",
        description: "請輸入有效的提領金額",
        variant: "destructive",
      });
      return;
    }

    // 檢查餘額是否足夠
    if (amount > balance) {
      toast({
        title: "餘額不足",
        description: `公基金餘額不足，當前餘額：${balance} 鑽石`,
        variant: "destructive",
      });
      return;
    }

    // 創建提領記錄
    const newRecord: PublicFundRecord = {
      id: Date.now(),
      type: "支出",
      amount: amount,
      reason: `提領：${withdrawForm.reason}`,
      description: withdrawForm.reason,
      date: new Date().toLocaleString('zh-TW'),
      category: "公基金提領",
      createdBy: profile?.username || user?.username || "管理員"
    };

    // 保存記錄
    const savedRecords = JSON.parse(localStorage.getItem('publicFundRecords') || '[]');
    savedRecords.unshift(newRecord);
    localStorage.setItem('publicFundRecords', JSON.stringify(savedRecords));

    // 更新公基金餘額
    const publicFundData = JSON.parse(localStorage.getItem('publicFundData') || '{}');
    publicFundData.balance = (publicFundData.balance || 0) - amount;
    localStorage.setItem('publicFundData', JSON.stringify(publicFundData));

    loadRecords();
    setWithdrawForm({ amount: "", reason: "" });
    setWithdrawDialogOpen(false);

    toast({
      title: "提領成功",
      description: `已從公基金提領 ${amount} 鑽石`,
    });

    // 觸發公基金更新事件
    window.dispatchEvent(new Event('publicFundUpdate'));
  };

  // 處理增加
  const handleDeposit = () => {
    if (!depositForm.amount || !depositForm.reason) {
      toast({
        title: "填寫錯誤",
        description: "請填寫增加金額和事由",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "金額錯誤",
        description: "請輸入有效的增加金額",
        variant: "destructive",
      });
      return;
    }

    // 創建增加記錄
    const newRecord: PublicFundRecord = {
      id: Date.now(),
      type: "收入",
      amount: amount,
      reason: `增加：${depositForm.reason}`,
      description: depositForm.reason,
      date: new Date().toLocaleString('zh-TW'),
      category: "公基金增加",
      createdBy: profile?.username || user?.username || "管理員"
    };

    // 保存記錄
    const savedRecords = JSON.parse(localStorage.getItem('publicFundRecords') || '[]');
    savedRecords.unshift(newRecord);
    localStorage.setItem('publicFundRecords', JSON.stringify(savedRecords));

    // 更新公基金餘額
    const publicFundData = JSON.parse(localStorage.getItem('publicFundData') || '{}');
    publicFundData.balance = (publicFundData.balance || 0) + amount;
    localStorage.setItem('publicFundData', JSON.stringify(publicFundData));

    loadRecords();
    setDepositForm({ amount: "", reason: "" });
    setDepositDialogOpen(false);

    toast({
      title: "增加成功",
      description: `已向公基金增加 ${amount} 鑽石`,
    });

    // 觸發公基金更新事件
    window.dispatchEvent(new Event('publicFundUpdate'));
  };

  const getTypeColor = (type: string) => {
    return type === "收入" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "拍賣抽成": return "bg-amber-100 text-amber-800";
      case "團隊補助": return "bg-blue-100 text-blue-800";
      case "活動獎勵": return "bg-green-100 text-green-800";
      case "設備購買": return "bg-purple-100 text-purple-800";
      case "其他": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate statistics - 只基於手動操作記錄
  const totalWithdraw = records.filter(r => r.type === "支出").reduce((sum, r) => sum + r.amount, 0);
  const totalDeposit = records.filter(r => r.type === "收入").reduce((sum, r) => sum + r.amount, 0);

  const incomeRecords = records.filter(r => r.type === "收入");
  const expenseRecords = records.filter(r => r.type === "支出");

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
                🏛️ 公基金收入支出
              </h1>
              <p className="text-treasure-gold/80">
                {team?.name} | {user?.username}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 提領按鈕 */}
            <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 to-red-400 text-white"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  提領
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-md bg-treasure-surface/95 backdrop-blur-sm border-treasure-border">
                <DialogHeader>
                  <DialogTitle className="text-red-400 text-xl">
                    <Minus className="w-5 h-5 inline mr-2" />
                    公基金提領
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="text-sm text-treasure-gold/70 bg-treasure-surface/30 p-3 rounded-lg">
                    當前公基金餘額：<span className="font-bold text-treasure-gold">{balance}</span> 鑽石
                  </div>

                  <div>
                    <Label className="text-treasure-gold">提領金額</Label>
                    <Input
                      type="number"
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="請輸入提領金額"
                      className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50"
                    />
                  </div>

                  <div>
                    <Label className="text-treasure-gold">提領事由</Label>
                    <Textarea
                      value={withdrawForm.reason}
                      onChange={(e) => setWithdrawForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="請說明提領原因"
                      className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50 min-h-[80px]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setWithdrawForm({ amount: "", reason: "" });
                        setWithdrawDialogOpen(false);
                      }}
                      className="border-treasure-border text-treasure-gold hover:bg-treasure-surface/30"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleWithdraw}
                      className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 to-red-400 text-white"
                    >
                      確認提領
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* 增加按鈕 */}
            <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 to-green-400 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  增加
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-md bg-treasure-surface/95 backdrop-blur-sm border-treasure-border">
                <DialogHeader>
                  <DialogTitle className="text-green-400 text-xl">
                    <Plus className="w-5 h-5 inline mr-2" />
                    公基金增加
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="text-sm text-treasure-gold/70 bg-treasure-surface/30 p-3 rounded-lg">
                    當前公基金餘額：<span className="font-bold text-treasure-gold">{balance}</span> 鑽石
                  </div>

                  <div>
                    <Label className="text-treasure-gold">增加金額</Label>
                    <Input
                      type="number"
                      value={depositForm.amount}
                      onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="請輸入增加金額"
                      className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50"
                    />
                  </div>

                  <div>
                    <Label className="text-treasure-gold">增加事由</Label>
                    <Textarea
                      value={depositForm.reason}
                      onChange={(e) => setDepositForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="請說明增加原因"
                      className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50 min-h-[80px]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDepositForm({ amount: "", reason: "" });
                        setDepositDialogOpen(false);
                      }}
                      className="border-treasure-border text-treasure-gold hover:bg-treasure-surface/30"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleDeposit}
                      className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 to-green-400 text-white"
                    >
                      確認增加
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={resetForm}
                  className="bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新增記錄
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl bg-treasure-surface/95 backdrop-blur-sm border-treasure-border">
                <DialogHeader>
                  <DialogTitle className="text-treasure-gold text-xl">
                    <DollarSign className="w-5 h-5 inline mr-2" />
                    {editingRecord ? "編輯記錄" : "新增記錄"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-treasure-gold">類型</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value: "收入" | "支出") => setFormData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="bg-treasure-surface/50 border-treasure-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-treasure-surface border-treasure-border">
                          <SelectItem value="收入">收入</SelectItem>
                          <SelectItem value="支出">支出</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-treasure-gold">金額</Label>
                      <Input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="請輸入金額"
                        className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-treasure-gold">項目名稱</Label>
                    <Input
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="請輸入項目名稱"
                      className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50"
                    />
                  </div>

                  <div>
                    <Label className="text-treasure-gold">分類</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="bg-treasure-surface/50 border-treasure-border text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-treasure-surface border-treasure-border">
                        <SelectItem value="拍賣抽成">拍賣抽成</SelectItem>
                        <SelectItem value="團隊補助">團隊補助</SelectItem>
                        <SelectItem value="活動獎勵">活動獎勵</SelectItem>
                        <SelectItem value="設備購買">設備購買</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-treasure-gold">詳細說明</Label>
                    <Textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="請輸入詳細說明..."
                      className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50 resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setIsDialogOpen(false);
                      }}
                      className="border-treasure-border text-treasure-gold hover:bg-treasure-surface/50"
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue"
                    >
                      {editingRecord ? "更新記錄" : "新增記錄"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

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

        {/* Overview Card */}
        <div className="flex justify-center mb-6">
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border max-w-md w-full">
            <CardContent className="p-8 text-center">
              <Coins className="w-16 h-16 mx-auto mb-4 text-treasure-gold" />
              <div className="text-4xl font-bold text-treasure-gold mb-3">{balance}</div>
              <div className="text-lg text-treasure-gold/80">當前公基金額度</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deposit Records */}
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-treasure-gold">
                <TrendingUp className="w-5 h-5 text-green-400" />
                增加記錄 ({incomeRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {incomeRecords.map((record) => (
                    <div key={record.id} className="p-4 bg-treasure-surface/30 rounded-lg border border-treasure-border hover:bg-treasure-surface/40 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-treasure-gold">{record.reason}</span>
                            <Badge className={`text-xs ${getCategoryColor(record.category)}`}>
                              {record.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-treasure-gold/70 mb-1">{record.description}</p>
                          <div className="text-xs text-treasure-gold/50">{record.date} | {record.createdBy}</div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div className="font-bold text-lg text-green-400">
                            +{record.amount} 鑽石
                          </div>
                          {!record.id.toString().startsWith('dist_') && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(record)}
                                className="text-treasure-gold/70 hover:text-treasure-gold hover:bg-treasure-surface/30 p-1 h-8 w-8"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(record.id)}
                                className="text-red-400/70 hover:text-red-400 hover:bg-red-400/10 p-1 h-8 w-8"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {incomeRecords.length === 0 && (
                  <div className="text-center py-8 text-treasure-gold/50">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>尚無增加記錄</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Withdraw Records */}
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-treasure-gold">
                <TrendingDown className="w-5 h-5 text-red-400" />
                提領記錄 ({expenseRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {expenseRecords.map((record) => (
                    <div key={record.id} className="p-4 bg-treasure-surface/30 rounded-lg border border-treasure-border hover:bg-treasure-surface/40 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-treasure-gold">{record.reason}</span>
                            <Badge className={`text-xs ${getCategoryColor(record.category)}`}>
                              {record.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-treasure-gold/70 mb-1">{record.description}</p>
                          <div className="text-xs text-treasure-gold/50">{record.date} | {record.createdBy}</div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div className="font-bold text-lg text-red-400">
                            -{record.amount} 鑽石
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(record)}
                              className="text-treasure-gold/70 hover:text-treasure-gold hover:bg-treasure-surface/30 p-1 h-8 w-8"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(record.id)}
                              className="text-red-400/70 hover:text-red-400 hover:bg-red-400/10 p-1 h-8 w-8"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {expenseRecords.length === 0 && (
                  <div className="text-center py-8 text-treasure-gold/50">
                    <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>尚無提領記錄</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicFundManager;