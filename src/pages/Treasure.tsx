import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Package, Plus, Star, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Treasure = () => {
  const navigate = useNavigate();
  const { profile, team, user } = useCustomAuth();
  const { toast } = useToast();
  
  const [itemName, setItemName] = useState("");
  const [itemLevel, setItemLevel] = useState("");
  const [serverName, setServerName] = useState("");
  const [dropDate, setDropDate] = useState("");
  const [bossName, setBossName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [pickerName, setPickerName] = useState("");
  
  // Participants dialog state
  const [participants, setParticipants] = useState<string[]>([]);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [participantInput, setParticipantInput] = useState<string>("");
  const [showParticipantSuggestions, setShowParticipantSuggestions] = useState(false);
  
  // Team members for selection
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  
  // Basic settings for diamond distribution
  const [basicSettings, setBasicSettings] = useState({
    bonusForOpener: false,
    bonusForLeader: false,
  });

  // Mock registered treasures
  const [treasures] = useState([
    {
      id: 1,
      name: "龍鱗護甲",
      description: "稀有防具，防禦力+500",
      category: "防具",
      rarity: "稀有",
      registeredBy: "管理員",
      registeredAt: "2025-08-21 10:30",
      status: "待審核"
    },
    {
      id: 2,
      name: "烈焰之劍", 
      description: "傳說武器，攻擊力+800",
      category: "武器",
      rarity: "傳說",
      registeredBy: "隊長",
      registeredAt: "2025-08-21 09:15",
      status: "已上架"
    }
  ]);

  // Get existing pending items from localStorage
  const [pendingItems, setPendingItems] = useState(() => {
    const saved = localStorage.getItem('pendingTreasures');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever pendingItems changes
  useEffect(() => {
    localStorage.setItem('pendingTreasures', JSON.stringify(pendingItems));
  }, [pendingItems]);

  // Load basic settings
  useEffect(() => {
    const savedSettings = localStorage.getItem("basicSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setBasicSettings({
          bonusForOpener: parsed.bonusForOpener || false,
          bonusForLeader: parsed.bonusForLeader || false,
        });
      } catch (error) {
        console.error("Failed to load basic settings:", error);
      }
    }
  }, []);

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

  // Track auto-added participants
  const [autoAddedParticipants, setAutoAddedParticipants] = useState<{opener?: string, leader?: string}>({});

  // Auto-add opener and leader to participants based on settings
  useEffect(() => {
    let updatedParticipants = [...participants];
    let updatedAutoAdded = { ...autoAddedParticipants };
    let changed = false;

    // Remove previously auto-added opener
    if (autoAddedParticipants.opener) {
      const index = updatedParticipants.lastIndexOf(autoAddedParticipants.opener);
      if (index !== -1) {
        updatedParticipants.splice(index, 1);
        changed = true;
      }
      updatedAutoAdded.opener = undefined;
    }

    // Remove previously auto-added leader
    if (autoAddedParticipants.leader) {
      const index = updatedParticipants.lastIndexOf(autoAddedParticipants.leader);
      if (index !== -1) {
        updatedParticipants.splice(index, 1);
        changed = true;
      }
      updatedAutoAdded.leader = undefined;
    }

    // Add opener if enabled
    if (basicSettings.bonusForOpener && reporterName) {
      updatedParticipants.push(reporterName);
      updatedAutoAdded.opener = reporterName;
      changed = true;
    }

    // Add leader if enabled
    if (basicSettings.bonusForLeader && leaderName) {
      updatedParticipants.push(leaderName);
      updatedAutoAdded.leader = leaderName;
      changed = true;
    }

    if (changed) {
      setParticipants(updatedParticipants);
      setAutoAddedParticipants(updatedAutoAdded);
    }
  }, [basicSettings.bonusForOpener, basicSettings.bonusForLeader, reporterName, leaderName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName || !itemLevel || !serverName || !dropDate || !bossName || !leaderName || !reporterName || !pickerName) {
      toast({
        title: "登記失敗",
        description: "請填寫所有必要欄位",
        variant: "destructive",
      });
      return;
    }

    // Create new treasure item
    const newTreasure = {
      id: Date.now(), // Simple ID generation
      itemName,
      itemLevel,
      serverName,
      dropDate,
      bossName,
      leaderName,
      reporterName,
      pickerName,
      participants: [...participants],
      registeredBy: profile?.username || "未知用戶",
      registeredAt: new Date().toLocaleString('zh-TW'),
      status: "等待上架",
      teamId: team?.id
    };

    // Add to pending items
    setPendingItems(prev => [newTreasure, ...prev]);

    toast({
      title: "登記成功！",
      description: `${itemName} 已成功登記，已移動至等待上架`,
      duration: 3000,
    });
    
    // Reset form
    setItemName("");
    setItemLevel("");
    setServerName("");
    setDropDate("");
    setBossName("");
    setLeaderName("");
    setReporterName("");
    setPickerName("");
    setParticipants([]);
    setAutoAddedParticipants({});
    setParticipantInput("");

    // Navigate to home page after a short delay
    setTimeout(() => {
      navigate("/");
    }, 1500);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "普通": return "text-gray-600";
      case "稀有": return "text-blue-600";
      case "史詩": return "text-purple-600";
      case "傳說": return "text-orange-600";
      default: return "text-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "待審核": return "bg-yellow-100 text-yellow-800";
      case "已上架": return "bg-green-100 text-green-800";
      case "已拒絕": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // 處理參與人員輸入
  const handleParticipantInputChange = (value: string) => {
    setParticipantInput(value);
    setShowParticipantSuggestions(value.length > 0);
  };

  // 添加參與人員
  const addParticipantToList = (memberName: string) => {
    setParticipants([...participants, memberName]);
    setParticipantInput("");
    setShowParticipantSuggestions(false);
  };

  // 移除參與人員
  const removeParticipant = (index: number) => {
    const newParticipants = participants.filter((_, i) => i !== index);
    setParticipants(newParticipants);
  };

  // 獲取匹配的成員建議
  const getParticipantSuggestions = () => {
    if (!participantInput) return [];
    return teamMembers
      .filter(member => 
        member.toLowerCase().includes(participantInput.toLowerCase())
      )
      .slice(0, 5); // 限制顯示5個建議
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-treasure-deep-blue to-treasure-royal-blue p-6">
      <div className="max-w-3xl mx-auto">
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
              💎 寶物登記
            </h1>
            <p className="text-treasure-gold/80">
              {team?.name} | {user?.username}
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Registration Form */}
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-treasure-gold-dark/20 to-treasure-amber/20 border-b border-treasure-border">
              <CardTitle className="flex items-center gap-2 text-treasure-gold">
                <Plus className="w-5 h-5" />
                新寶物登記
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-white/5 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="itemName" className="text-treasure-gold">物品名稱 *</Label>
                  <Input
                    id="itemName"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="請輸入物品名稱"
                    required
                    className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50 focus:border-treasure-gold"
                  />
                </div>

                <div>
                  <Label className="text-treasure-gold">物品等級 *</Label>
                  <Select value={itemLevel} onValueChange={setItemLevel}>
                    <SelectTrigger className="bg-treasure-surface/50 border-treasure-border text-white">
                      <SelectValue placeholder="選擇物品等級" />
                    </SelectTrigger>
                    <SelectContent className="bg-treasure-surface border-treasure-border">
                      <SelectItem value="稀有" className="text-blue-400">稀有</SelectItem>
                      <SelectItem value="英雄" className="text-treasure-purple">英雄</SelectItem>
                      <SelectItem value="傳說" className="text-treasure-gold">傳說</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="serverName" className="text-treasure-gold">伺服器名稱 *</Label>
                  <Input
                    id="serverName"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="請輸入伺服器名稱"
                    required
                    className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50 focus:border-treasure-gold"
                  />
                </div>

                <div>
                  <Label htmlFor="dropDate" className="text-treasure-gold">掉落日期 *</Label>
                  <Input
                    id="dropDate"
                    type="date"
                    value={dropDate}
                    onChange={(e) => setDropDate(e.target.value)}
                    required
                    className="bg-treasure-surface/50 border-treasure-border text-white focus:border-treasure-gold"
                  />
                </div>

                <div>
                  <Label htmlFor="bossName" className="text-treasure-gold">BOSS名稱 *</Label>
                  <Input
                    id="bossName"
                    value={bossName}
                    onChange={(e) => setBossName(e.target.value)}
                    placeholder="請輸入BOSS名稱"
                    required
                    className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50 focus:border-treasure-gold"
                  />
                </div>

                <div>
                  <Label className="text-treasure-gold">團長名稱 *</Label>
                  <Select value={leaderName} onValueChange={setLeaderName}>
                    <SelectTrigger className="bg-treasure-surface/50 border-treasure-border text-white">
                      <SelectValue placeholder="選擇團長" />
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

                <div>
                  <Label className="text-treasure-gold">開單者名稱 *</Label>
                  <Select value={reporterName} onValueChange={setReporterName}>
                    <SelectTrigger className="bg-treasure-surface/50 border-treasure-border text-white">
                      <SelectValue placeholder="選擇開單者" />
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

                <div>
                  <Label className="text-treasure-gold">拾取者 *</Label>
                  <Select value={pickerName} onValueChange={setPickerName}>
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

                {/* Participants Dialog */}
                <div className="space-y-2">
                  <Label className="text-treasure-gold">參與人員</Label>
                   <Dialog open={isParticipantsOpen} onOpenChange={(open) => {
                     setIsParticipantsOpen(open);
                     if (!open) {
                       setParticipantInput("");
                       setShowParticipantSuggestions(false);
                     }
                   }}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-treasure-border text-treasure-gold hover:bg-treasure-surface/50"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        管理參與人員 ({participants.length}人)
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-treasure-surface border-treasure-border max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-treasure-gold flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          參與人員管理
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Member Input */}
                        <div className="space-y-3">
                          <Label className="text-treasure-gold text-sm">添加參與人員：</Label>
                          
                          {/* 成員輸入框 */}
                          <div className="relative">
                            <Input
                              value={participantInput}
                              onChange={(e) => handleParticipantInputChange(e.target.value)}
                              placeholder="輸入成員ID（支援關鍵字搜尋）"
                              className="bg-treasure-surface/50 border-treasure-border text-white placeholder:text-white/50 focus:border-treasure-gold"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && participantInput.trim()) {
                                  const exactMatch = teamMembers.find(m => m === participantInput.trim());
                                  const memberName = exactMatch || participantInput.trim();
                                  addParticipantToList(memberName);
                                }
                              }}
                            />
                            
                            {/* 自動完成建議 */}
                            {showParticipantSuggestions && getParticipantSuggestions().length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-treasure-surface border border-treasure-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                {getParticipantSuggestions().map((member) => (
                                  <div
                                    key={member}
                                    className="px-3 py-2 cursor-pointer hover:bg-treasure-gold/20 text-white border-b border-treasure-border last:border-b-0"
                                    onClick={() => addParticipantToList(member)}
                                  >
                                    {member}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 參與人員列表 */}
                        <div className="space-y-2">
                          <Label className="text-treasure-gold text-sm">參與人員列表：</Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {participants.map((participant, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-treasure-gold/10 p-3 rounded border border-treasure-border"
                              >
                                <span className="text-treasure-gold font-medium">{participant}</span>
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
                            {participants.length === 0 && (
                              <div className="text-center py-6 text-white/50 border border-treasure-border rounded-lg bg-treasure-surface/20">
                                尚未添加參與人員
                                <br />
                                <span className="text-xs">在上方輸入框中輸入成員ID</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-treasure-gold-dark to-treasure-gold hover:from-treasure-gold to-treasure-amber text-treasure-deep-blue font-bold py-3 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-treasure"
                >
                  登記寶物
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Treasure;