import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Trophy, Clock, User, Calendar, Crown, Zap, Gavel, Users, Edit, Trash2, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useToast } from "@/hooks/use-toast";

const PendingItems = () => {
  const navigate = useNavigate();
  const { profile, team, user } = useCustomAuth();
  const { toast } = useToast();
  
  const [pendingItems, setPendingItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedParticipantsItem, setSelectedParticipantsItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [editForm, setEditForm] = useState({
    leaderName: '',
    pickerName: '',
    participants: []
  });
  const [auctionForm, setAuctionForm] = useState({
    startingPrice: '',
    duration: '',
    bidType: 'open', // 'open' for 明標, 'sealed' for 暗標
    extensionEnabled: false,
    extensionMinutes: '10',
    extensionTime: '10'
  });

  // Load pending items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pendingTreasures');
    if (saved) {
      const items = JSON.parse(saved);
      // Filter items for current team (if team filtering is needed)
      const teamItems = team?.id ? items.filter(item => item.teamId === team.id) : items;
      setPendingItems(teamItems);
    }
  }, [team?.id]);

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

  const handleListToAuction = (item) => {
    setSelectedItem(item);
    setAuctionForm({
      startingPrice: '',
      duration: '',
      bidType: 'open',
      extensionEnabled: false,
      extensionMinutes: '10',
      extensionTime: '10'
    });
  };

  const handleShowParticipants = (item) => {
    setSelectedParticipantsItem(item);
  };

  const getAllParticipants = (item) => {
    const participants = [...(item.participants || [])];
    // 團長視為參與人員之一
    if (item.leaderName && !participants.includes(item.leaderName)) {
      participants.unshift(item.leaderName); // 將團長放在第一個
    }
    return participants;
  };

  const handleAuctionSubmit = () => {
    if (!auctionForm.startingPrice || !auctionForm.duration) {
      toast({
        title: "請填寫必要資訊",
        description: "請填寫競標起始價格和競標時長",
        variant: "destructive",
      });
      return;
    }

    // Remove item from pending and add to auctions
    const updatedPending = pendingItems.filter(item => item.id !== selectedItem.id);
    localStorage.setItem('pendingTreasures', JSON.stringify(updatedPending.filter(item => item.teamId === team?.id)));
    
    // Calculate end time based on duration
    const now = new Date();
    const durationMs = auctionForm.duration === '2min' ? 2 * 60 * 1000 : 2 * 60 * 60 * 1000;
    const endTime = new Date(now.getTime() + durationMs);
    
    // Save to auctions with proper endTime
    const auctionData = {
      ...selectedItem,
      ...auctionForm,
      status: 'active',
      listedAt: new Date().toLocaleString('zh-TW'),
      endTime: endTime,
      currentPrice: parseFloat(auctionForm.startingPrice),
      bidHistory: [],
      bidderCount: 0
    };
    
    const existingAuctions = JSON.parse(localStorage.getItem('activeAuctions') || '[]');
    existingAuctions.push(auctionData);
    localStorage.setItem('activeAuctions', JSON.stringify(existingAuctions));

    setPendingItems(updatedPending);
    setSelectedItem(null);
    
    toast({
      title: "成功上架拍賣",
      description: `${selectedItem.itemName} 已成功上架至拍賣場`,
    });
  };

  const resetAuctionForm = () => {
    setSelectedItem(null);
    setAuctionForm({
      startingPrice: '',
      duration: '',
      bidType: 'open',
      extensionEnabled: false,
      extensionMinutes: '10',
      extensionTime: '10'
    });
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditForm({
      leaderName: item.leaderName || '',
      pickerName: item.pickerName || '',
      participants: [...(item.participants || [])]
    });
  };

  const handleDeleteItem = (itemId) => {
    const updatedItems = pendingItems.filter(item => item.id !== itemId);
    setPendingItems(updatedItems);
    
    // Update localStorage
    localStorage.setItem('pendingTreasures', JSON.stringify(updatedItems));
    
    toast({
      title: "物品已刪除",
      description: "物品已從等待上架清單中移除",
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.leaderName || !editForm.pickerName) {
      toast({
        title: "請填寫必要資訊",
        description: "請選擇帶團者和拾取者",
        variant: "destructive",
      });
      return;
    }

    const updatedItems = pendingItems.map(item => 
      item.id === editingItem.id 
        ? { ...item, ...editForm }
        : item
    );
    
    setPendingItems(updatedItems);
    
    // Update localStorage
    localStorage.setItem('pendingTreasures', JSON.stringify(updatedItems));
    
    setEditingItem(null);
    setEditForm({ leaderName: '', pickerName: '', participants: [] });
    
    toast({
      title: "更新成功",
      description: "物品資訊已成功更新",
    });
  };

  const addParticipant = (memberName) => {
    if (!editForm.participants.includes(memberName)) {
      setEditForm({
        ...editForm,
        participants: [...editForm.participants, memberName]
      });
    }
  };

  const removeParticipant = (index) => {
    setEditForm({
      ...editForm,
      participants: editForm.participants.filter((_, i) => i !== index)
    });
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
              🏆 等待上架
            </h1>
            <p className="text-treasure-gold/80">
              {team?.name} | {user?.username}
            </p>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-treasure-gold/20 rounded-lg">
                  <Trophy className="w-5 h-5 text-treasure-gold" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">待處理物品</p>
                  <p className="text-xl font-bold text-treasure-gold">{pendingItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-treasure-amber/20 rounded-lg">
                  <Clock className="w-5 h-5 text-treasure-amber" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">平均處理時間</p>
                  <p className="text-xl font-bold text-treasure-gold">24小時</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-treasure-purple/20 rounded-lg">
                  <Zap className="w-5 h-5 text-treasure-purple" />
                </div>
                <div>
                  <p className="text-sm text-treasure-gold/70">處理狀態</p>
                  <p className="text-xl font-bold text-treasure-gold">等待中</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Items List */}
        <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
          <CardHeader className="bg-gradient-to-r from-treasure-gold-dark/20 to-treasure-amber/20 border-b border-treasure-border">
            <CardTitle className="flex items-center gap-2 text-treasure-gold">
              <Trophy className="w-5 h-5" />
              等待上架物品清單
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pendingItems.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-treasure-gold/30" />
                <h3 className="text-xl font-semibold text-treasure-gold mb-2">暫無等待上架物品</h3>
                <p className="text-treasure-gold/60 mb-4">
                  前往寶物登記頁面添加新的寶物
                </p>
                <Button
                  onClick={() => navigate("/treasure")}
                  className="bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue"
                >
                  立即登記寶物
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/5 rounded-lg p-6 border border-treasure-border hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Column - Item Info */}
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{getItemLevelIcon(item.itemLevel)}</span>
                          <div>
                            <h3 className="text-lg font-bold text-treasure-gold">
                              {item.itemName}
                            </h3>
                            <Badge className={`text-xs ${getItemLevelColor(item.itemLevel)}`}>
                              {item.itemLevel}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-treasure-gold/70">
                            <Crown className="w-4 h-4" />
                            <span>BOSS：{item.bossName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-treasure-gold/70">
                            <User className="w-4 h-4" />
                            <span>團長：{item.leaderName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-treasure-gold/70">
                            <Calendar className="w-4 h-4" />
                            <span>掉落：{item.dropDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Additional Info */}
                      <div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-treasure-gold/70">
                            <span>伺服器：</span>
                            <Badge variant="outline" className="text-treasure-gold border-treasure-border">
                              {item.serverName}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-treasure-gold/70">
                            <span>開單者：{item.reporterName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-treasure-gold/70">
                            <span>登記時間：{item.registeredAt}</span>
                          </div>
                          <div className="flex items-center gap-2 text-treasure-gold/70">
                            <span>登記者：{item.registeredBy}</span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <Clock className="w-3 h-3 mr-1" />
                            等待管理員處理
                          </Badge>
                          <div className="pt-2 space-y-2">
                            <Button
                              onClick={() => handleShowParticipants(item)}
                              variant="outline"
                              className="w-full border-treasure-border text-treasure-gold hover:bg-treasure-surface/50"
                              size="sm"
                            >
                              <Users className="w-4 h-4 mr-2" />
                              參與人員 ({getAllParticipants(item).length}人)
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEditItem(item)}
                                variant="outline"
                                className="flex-1 border-treasure-border text-treasure-gold hover:bg-treasure-surface/50"
                                size="sm"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                編輯
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    size="sm"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    刪除
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-treasure-surface/95 backdrop-blur-sm border-treasure-border">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-treasure-gold">確認刪除</AlertDialogTitle>
                                    <AlertDialogDescription className="text-treasure-gold/70">
                                      確定要刪除「{item.itemName}」嗎？此操作無法復原。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border-gray-500">
                                      取消
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30"
                                    >
                                      刪除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            <Button
                              onClick={() => handleListToAuction(item)}
                              className="w-full bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue"
                              size="sm"
                            >
                              <Gavel className="w-4 h-4 mr-2" />
                              上架至拍賣場
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Participants Dialog */}
        <Dialog open={selectedParticipantsItem !== null} onOpenChange={(open) => !open && setSelectedParticipantsItem(null)}>
          <DialogContent className="bg-treasure-surface/95 backdrop-blur-sm border-treasure-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-treasure-gold flex items-center gap-2">
                <Users className="w-5 h-5" />
                參與人員清單
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedParticipantsItem && (
                <>
                  <div className="text-center">
                    <h3 className="text-treasure-gold font-semibold">{selectedParticipantsItem.itemName}</h3>
                    <p className="text-treasure-gold/70 text-sm">共 {getAllParticipants(selectedParticipantsItem).length} 人參與</p>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getAllParticipants(selectedParticipantsItem).map((participant, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-treasure-surface/30 p-3 rounded border border-treasure-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-treasure-gold/20 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-treasure-gold" />
                          </div>
                          <div>
                            <span className="text-white font-medium">{participant}</span>
                            {index === 0 && participant === selectedParticipantsItem.leaderName && (
                              <Badge className="ml-2 bg-treasure-gold/20 text-treasure-gold border-treasure-gold/30 text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                團長
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {getAllParticipants(selectedParticipantsItem).length === 0 && (
                      <div className="text-center py-4 text-white/50">
                        尚未添加參與人員
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={editingItem !== null} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent className="bg-treasure-surface/95 backdrop-blur-sm border-treasure-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-treasure-gold flex items-center gap-2">
                <Edit className="w-5 h-5" />
                編輯物品資訊
              </DialogTitle>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-6">
                <div className="text-center p-4 bg-treasure-surface/30 rounded-lg border border-treasure-border">
                  <h3 className="text-treasure-gold font-semibold text-lg">{editingItem.itemName}</h3>
                  <p className="text-treasure-gold/70 text-sm">編輯此物品的相關資訊</p>
                </div>

                <div className="space-y-4">
                  {/* Leader Selection */}
                  <div>
                    <Label className="text-treasure-gold">帶團者 *</Label>
                    <Select value={editForm.leaderName} onValueChange={(value) => setEditForm({...editForm, leaderName: value})}>
                      <SelectTrigger className="bg-treasure-surface/50 border-treasure-border text-white">
                        <SelectValue placeholder="選擇帶團者" />
                      </SelectTrigger>
                      <SelectContent className="bg-treasure-surface border-treasure-border">
                        {teamMembers.map((memberName) => (
                          <SelectItem key={memberName} value={memberName} className="text-treasure-gold">
                            {memberName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Picker Selection */}
                  <div>
                    <Label className="text-treasure-gold">拾取者 *</Label>
                    <Select value={editForm.pickerName} onValueChange={(value) => setEditForm({...editForm, pickerName: value})}>
                      <SelectTrigger className="bg-treasure-surface/50 border-treasure-border text-white">
                        <SelectValue placeholder="選擇拾取者" />
                      </SelectTrigger>
                      <SelectContent className="bg-treasure-surface border-treasure-border">
                        {teamMembers.map((memberName) => (
                          <SelectItem key={memberName} value={memberName} className="text-treasure-gold">
                            {memberName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Participants Management */}
                  <div className="space-y-3">
                    <Label className="text-treasure-gold">參與成員</Label>
                    
                    {/* Team Members Selection */}
                    <div className="space-y-2">
                      <Label className="text-treasure-gold text-sm">快速選取團隊成員：</Label>
                      <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {teamMembers.map((memberName) => (
                          <Button
                            key={memberName}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addParticipant(memberName)}
                            disabled={editForm.participants.includes(memberName)}
                            className="text-xs justify-start border-treasure-border text-treasure-gold hover:bg-treasure-surface/50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            {memberName}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Current Participants */}
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      <Label className="text-treasure-gold text-sm">目前參與成員：</Label>
                      {editForm.participants.map((participant, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-treasure-surface/30 p-2 rounded border border-treasure-border"
                        >
                          <span className="text-white">{participant}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParticipant(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {editForm.participants.length === 0 && (
                        <div className="text-center py-4 text-white/50 text-sm">
                          尚未添加參與成員
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setEditingItem(null)}
                    variant="outline"
                    className="flex-1 border-treasure-border text-treasure-gold hover:bg-treasure-surface/50"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue"
                  >
                    儲存變更
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Auction Listing Dialog */}
        <AlertDialog open={selectedItem !== null} onOpenChange={(open) => !open && resetAuctionForm()}>
          <AlertDialogContent className="max-w-2xl bg-treasure-surface/95 backdrop-blur-sm border-treasure-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-treasure-gold text-xl">
                <Gavel className="w-5 h-5 inline mr-2" />
                上架至拍賣場
              </AlertDialogTitle>
              <AlertDialogDescription className="text-treasure-gold/70">
                {selectedItem && `將 ${selectedItem.itemName} 上架至拍賣場`}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-6 py-4">
              {/* Starting Price */}
              <div className="space-y-2">
                <Label htmlFor="startingPrice" className="text-treasure-gold">競標起始價格 *</Label>
                <Input
                  id="startingPrice"
                  type="number"
                  placeholder="輸入起始價格"
                  value={auctionForm.startingPrice}
                  onChange={(e) => setAuctionForm({...auctionForm, startingPrice: e.target.value})}
                  className="bg-treasure-surface/50 border-treasure-border text-treasure-gold placeholder:text-treasure-gold/50"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label className="text-treasure-gold">競標時長 *</Label>
                <Select value={auctionForm.duration} onValueChange={(value) => setAuctionForm({...auctionForm, duration: value})}>
                  <SelectTrigger className="bg-treasure-surface/50 border-treasure-border text-treasure-gold">
                    <SelectValue placeholder="選擇競標時長" />
                  </SelectTrigger>
                  <SelectContent className="bg-treasure-surface border-treasure-border">
                    <SelectItem value="2min" className="text-treasure-gold hover:bg-treasure-gold/10">2分鐘 (測試用)</SelectItem>
                    <SelectItem value="1h" className="text-treasure-gold hover:bg-treasure-gold/10">1小時</SelectItem>
                    <SelectItem value="6h" className="text-treasure-gold hover:bg-treasure-gold/10">6小時</SelectItem>
                    <SelectItem value="12h" className="text-treasure-gold hover:bg-treasure-gold/10">12小時</SelectItem>
                    <SelectItem value="24h" className="text-treasure-gold hover:bg-treasure-gold/10">24小時</SelectItem>
                    <SelectItem value="48h" className="text-treasure-gold hover:bg-treasure-gold/10">48小時</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bid Type */}
              <div className="space-y-3">
                <Label className="text-treasure-gold">競標類型</Label>
                <RadioGroup value={auctionForm.bidType} onValueChange={(value) => setAuctionForm({...auctionForm, bidType: value})}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="open" id="open" className="border-treasure-gold text-treasure-gold" />
                    <Label htmlFor="open" className="text-treasure-gold">明標 (公開競標)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sealed" id="sealed" className="border-treasure-gold text-treasure-gold" />
                    <Label htmlFor="sealed" className="text-treasure-gold">暗標 (密封競標)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Extension Mechanism */}
              <div className="space-y-3">
                <Label className="text-treasure-gold">競標延長機制</Label>
                <div className="space-y-3 p-4 bg-treasure-surface/30 rounded-lg border border-treasure-border">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="extensionEnabled"
                      checked={auctionForm.extensionEnabled}
                      onChange={(e) => setAuctionForm({...auctionForm, extensionEnabled: e.target.checked})}
                      className="rounded border-treasure-border"
                    />
                    <Label htmlFor="extensionEnabled" className="text-treasure-gold text-sm">
                      啟用延長機制
                    </Label>
                  </div>
                  
                  {auctionForm.extensionEnabled && (
                    <div className="flex items-center gap-2 text-sm text-treasure-gold flex-wrap">
                      <span>競標結束前</span>
                      <Select 
                        value={auctionForm.extensionMinutes} 
                        onValueChange={(value) => setAuctionForm({...auctionForm, extensionMinutes: value})}
                      >
                        <SelectTrigger className="w-16 h-8 bg-treasure-surface/50 border-treasure-border text-treasure-gold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-treasure-surface border-treasure-border z-50">
                          <SelectItem value="10" className="text-treasure-gold hover:bg-treasure-gold/10">10</SelectItem>
                          <SelectItem value="20" className="text-treasure-gold hover:bg-treasure-gold/10">20</SelectItem>
                          <SelectItem value="60" className="text-treasure-gold hover:bg-treasure-gold/10">60</SelectItem>
                        </SelectContent>
                      </Select>
                      <span>分鐘有新出價則延長</span>
                      <Select 
                        value={auctionForm.extensionTime} 
                        onValueChange={(value) => setAuctionForm({...auctionForm, extensionTime: value})}
                      >
                        <SelectTrigger className="w-16 h-8 bg-treasure-surface/50 border-treasure-border text-treasure-gold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-treasure-surface border-treasure-border z-50">
                          <SelectItem value="10" className="text-treasure-gold hover:bg-treasure-gold/10">10</SelectItem>
                          <SelectItem value="20" className="text-treasure-gold hover:bg-treasure-gold/10">20</SelectItem>
                          <SelectItem value="60" className="text-treasure-gold hover:bg-treasure-gold/10">60</SelectItem>
                        </SelectContent>
                      </Select>
                      <span>分鐘</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <AlertDialogFooter className="space-x-2">
              <AlertDialogCancel 
                onClick={resetAuctionForm}
                className="bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border-gray-500"
              >
                清除
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleAuctionSubmit}
                className="bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue"
              >
                確定上架
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default PendingItems;