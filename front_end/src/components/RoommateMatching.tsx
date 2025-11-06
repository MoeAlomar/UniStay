import { useEffect, useMemo, useState, useLayoutEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import type { User } from "../services/auth";
import { profile } from "../services/auth";
import type { RoommatePost, RoommateGroup } from "../services/roommates";
import { posts as fetchPosts, createPost, deletePost, groups as fetchGroups, createRequest, requests as fetchRequests, acceptRequest, rejectRequest, deleteRequest, leaveGroup, kickMember, type RoommateRequest } from "../services/roommates";
import { districtChoices } from "../services/listings";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible";

interface RoommateMatchingProps {
  onNavigate: (page: string) => void;
}

const universities = [
  "King Saud University",
  "Princess Nourah University",
  "Imam University",
  "Al Yamamah University",
];

// District options loaded from backend listings choices (sorted)
// Fallback to empty until loaded
const initialDistricts: string[] = [];

// Measure a container's scrollHeight and update on resize
function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [h, setH] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setH(el.scrollHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, height: h } as const;
}

export function RoommateMatching({ onNavigate }: RoommateMatchingProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tabValue, setTabValue] = useState<string>("find");

  // Lists
  const [postList, setPostList] = useState<RoommatePost[]>([]);
  const [groupsList, setGroupsList] = useState<RoommateGroup[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [requestsList, setRequestsList] = useState<RoommateRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  // Filters
  const [filtersOpen, setFiltersOpen] = useState<boolean>(true);
  // Applied filters
  const [filterUniversity, setFilterUniversity] = useState<string>("any");
  const [filterFemaleOnly, setFilterFemaleOnly] = useState<string>("any");
  const [filterDistrict, setFilterDistrict] = useState<string>("any");
  const [filterType, setFilterType] = useState<string>("any");
  // Pending (UI) filters
  const [pendingUniversity, setPendingUniversity] = useState<string>("any");
  const [pendingFemaleOnly, setPendingFemaleOnly] = useState<string>("any");
  const [pendingDistrict, setPendingDistrict] = useState<string>("any");
  const [pendingType, setPendingType] = useState<string>("any");
  const [districtOptions, setDistrictOptions] = useState<string[]>(initialDistricts);

  // Measured height for smooth expand/collapse without height:auto race
  const { ref: filtersInnerRef, height: filtersInnerHeight } = useMeasuredHeight<HTMLDivElement>();

  // --- Constant-speed + frozen target height ---
  const [frozenH, setFrozenH] = useState<number | null>(null);
  const prevHRef = useRef(0);

  const rawTarget = filtersOpen ? filtersInnerHeight : 0;
  const targetH = frozenH ?? rawTarget;

  // lock target when toggling, so RO updates won't re-target mid-flight
  useEffect(() => {
    setFrozenH(filtersOpen ? filtersInnerHeight : 0);
  }, [filtersOpen]);

  // compute duration from distance => near-constant speed
  const PX_PER_SEC = 600;   // tuned speed: 600 px/sec
  const MIN_DUR = 0.20;
  const MAX_DUR = 0.50;
  const distance = Math.abs(prevHRef.current - targetH);
  const duration = Math.min(MAX_DUR, Math.max(MIN_DUR, distance / PX_PER_SEC));

  // perfectly linear easing for constant speed
  const EASE: number[] = [0, 0, 1, 1];

  // after each retarget, remember the last target
  useLayoutEffect(() => {
    prevHRef.current = targetH;
  }, [targetH]);

  // Create Post form
  const [maxBudget, setMaxBudget] = useState<number>(1500);
  const [preferredType, setPreferredType] = useState<"APARTMENT" | "STUDIO" | "OTHER" | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [femaleOnly, setFemaleOnly] = useState<boolean>(false);
  const [university, setUniversity] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);

  // Details & Request
  const [selectedPost, setSelectedPost] = useState<RoommatePost | null>(null);
  const [requestNotes, setRequestNotes] = useState<string>("");
  const [sendingRequest, setSendingRequest] = useState<boolean>(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  // Group details
  const [selectedGroup, setSelectedGroup] = useState<RoommateGroup | null>(null);

  useEffect(() => {
    // Load user and initial data
    (async () => {
      try {
        const user = await profile();
        setCurrentUser(user);
      } catch (e) {
        // not critical for listing, tokens likely missing
      }
      try {
        setLoadingPosts(true);
        const list = await fetchPosts();
        setPostList(list);
      } catch (e: any) {
        setError("Failed to load roommate posts.");
      } finally {
        setLoadingPosts(false);
      }
      try {
        setLoadingGroups(true);
        const glist = await fetchGroups();
        setGroupsList(glist);
      } catch (e: any) {
        // groups may be empty; ignore softly
      } finally {
        setLoadingGroups(false);
      }
      try {
        const districts = await districtChoices();
        setDistrictOptions(districts);
      } catch (e) {
        // ignore; keep empty fallback
      }
    })();
  }, []);

  useEffect(() => {
    if (tabValue === "requests") {
      (async () => {
        try {
          setLoadingRequests(true);
          setRequestsError(null);
          const list = await fetchRequests();
          setRequestsList(list);
        } catch (e) {
          setRequestsError("Failed to load requests.");
        } finally {
          setLoadingRequests(false);
        }
      })();
    }
  }, [tabValue]);

  const myGroups = useMemo(() => {
    if (!currentUser) return groupsList;
    return groupsList.filter((g) => (g.members || []).some((m) => (m as any).id === currentUser.id));
  }, [groupsList, currentUser]);

  const filteredPosts = useMemo(() => {
    return postList.filter((p) => {
      if (filterUniversity !== "any" && (p.university || "").toLowerCase() !== filterUniversity.toLowerCase()) return false;
      if (filterDistrict !== "any" && (p.district || "").toLowerCase() !== filterDistrict.toLowerCase()) return false;
      if (filterFemaleOnly !== "any" && (p.female_only ? "female" : "any") !== filterFemaleOnly) return false;
      if (filterType !== "any" && p.preferred_type !== filterType) return false;
      return true;
    });
  }, [postList, filterUniversity, filterDistrict, filterFemaleOnly, filterType]);

  async function handleApplyFilters() {
    // Apply pending UI selections to active filters
    setFilterUniversity(pendingUniversity);
    setFilterDistrict(pendingDistrict);
    setFilterFemaleOnly(pendingFemaleOnly);
    setFilterType(pendingType);
    // Fetch server-side filtered list for better performance
    const params: Record<string, any> = {};
    if (pendingUniversity !== "any") params.university = pendingUniversity;
    if (pendingDistrict !== "any") params.district = pendingDistrict;
    if (pendingFemaleOnly === "female") params.female_only = true;
    if (pendingType !== "any") params.preferred_type = pendingType;
    try {
      setLoadingPosts(true);
      const list = await fetchPosts(params);
      setPostList(list);
    } catch (e) {
      // keep client-side filtering if request fails
    } finally {
      setLoadingPosts(false);
    }
  }

  async function handleSendRequest() {
    if (!selectedPost || !selectedPost.author?.id) return;
    // Disallow sending requests if user is already in a group
    if (myGroups.length > 0) {
      setRequestError("You are already in a group. Leave your group to send requests.");
      return;
    }
    try {
      setSendingRequest(true);
      setRequestError(null);
      setRequestSuccess(null);
      await createRequest({ receiver: selectedPost.author.id, post: selectedPost.id, notes: requestNotes || undefined });
      setRequestSuccess("Request sent successfully.");
    } catch (e: any) {
      const backendMsg = e?.response?.data?.error || e?.response?.data?.detail;
      setRequestError(backendMsg || "Failed to send request. Please try again.");
    } finally {
      setSendingRequest(false);
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const payload = {
        max_budget: maxBudget,
        preferred_type: preferredType,
        notes: notes || null,
        female_only: femaleOnly,
        university: university || null,
        district: district || null,
      } as Omit<RoommatePost, "id" | "author" | "created_at" | "updated_at">;
      const created = await createPost(payload);
      setPostList((prev) => [created, ...prev]);
      // reset minimal fields
      setNotes("");
    } catch (e: any) {
      setError("Failed to create roommate post.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePost(postId: string) {
    try {
      await deletePost(postId);
      setPostList((prev) => prev.filter((x) => x.id !== postId));
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
    } catch (e) {
      // Best-effort: silently fail for now
    }
  }

  function formatName(u?: User | null) {
    // Ensure identical display for sender and receiver: use username consistently
    return (u && u.username) ? u.username : "User";
  }

  function splitRequests() {
    const me = currentUser?.id;
    const received = requestsList.filter((r) => (r.receiver as any) === me && r.status === "PENDING");
    const sent = requestsList.filter((r) => r.sender?.id === me);
    return { received, sent };
  }

  async function handleAccept(id: string) {
    try {
      await acceptRequest(id);
      const list = await fetchRequests();
      setRequestsList(list);
      // Refresh groups so accepted requests reflect immediately
      const glist = await fetchGroups();
      setGroupsList(glist);
    } catch {}
  }

  async function handleReject(id: string) {
    try {
      await rejectRequest(id);
      const list = await fetchRequests();
      setRequestsList(list);
    } catch {}
  }

  async function handleDelete(id: string) {
    try {
      await deleteRequest(id);
      const list = await fetchRequests();
      setRequestsList(list);
    } catch {}
  }

  async function handleLeaveSelectedGroup() {
    if (!selectedGroup) return;
    try {
      await leaveGroup(selectedGroup.id);
      const glist = await fetchGroups();
      setGroupsList(glist);
      setSelectedGroup(null);
    } catch {}
  }

  async function handleKickMember(groupId: string, memberId: number) {
    try {
      await kickMember(groupId, memberId);
      const glist = await fetchGroups();
      setGroupsList(glist);
      // Keep dialog open but refresh selected group from new list
      const updated = glist.find((g) => g.id === groupId) || null;
      setSelectedGroup(updated);
    } catch {}
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-foreground">Roommates</h1>
          <p className="text-muted-foreground">
            Find roommate posts and manage your group
          </p>
        </div>

        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabsList
            className="mb-6 -mx-2 flex items-end gap-2 border-b border-muted"
          >
            <TabsTrigger
              value="find"
              className="rounded-t-md px-4 py-2 text-sm font-medium border border-muted bg-muted/40 hover:bg-muted/60 transition-colors data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground data-[state=active]:border-b-transparent"
            >
              Find
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="rounded-t-md px-4 py-2 text-sm font-medium border border-muted bg-muted/40 hover:bg-muted/60 transition-colors data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground data-[state=active]:border-b-transparent"
            >
              Requests
            </TabsTrigger>
            <TabsTrigger
              value="group"
              className="rounded-t-md px-4 py-2 text-sm font-medium border border-muted bg-muted/40 hover:bg-muted/60 transition-colors data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground data-[state=active]:border-b-transparent"
            >
              My Group
            </TabsTrigger>
          </TabsList>

          {/* Find Tab */}
          <TabsContent value="find">
            <div className="grid lg:grid-cols-[320px_1fr] gap-6">
              {/* Filter + Create Sidebar */}
              <div className="flex-shrink-0">
                {/* Filters */}
                <Card className="mb-6 lg:sticky lg:top-24">
                  <CardContent className="p-6">
                    <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between mb-4 cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-5 h-5 text-primary" />
                            <h3 className="text-foreground">Filters</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {filtersOpen ? "Click to collapse" : "Click to expand"}
                            </span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent
                        asChild
                        forceMount
                        // kill shadcn keyframes so only Framer animates
                        className="overflow-hidden data-[state=open]:animate-none data-[state=closed]:animate-none"
                      >
                        <motion.div
                          // keep a single animator in control
                          initial={false}
                          animate={{ height: targetH }}
                          transition={{
                            height: { duration, ease: EASE },
                          }}
                          // once open, let layout breathe without flicker
                          transitionEnd={filtersOpen ? { height: "auto" } : {}}
                          style={{ overflow: "hidden", willChange: "height" }}
                          onAnimationComplete={() => {
                            // unlock measurement again for future opens
                            setFrozenH(null);
                          }}
                        >
                          {/* This is the element we measure */}
                          <div ref={filtersInnerRef}>
                            <div className="mb-5">
                              <Label className="mb-2 block">University</Label>
                              <Select value={pendingUniversity} onValueChange={setPendingUniversity}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any</SelectItem>
                                  {universities.map((u) => (
                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="mb-5">
                              <Label className="mb-2 block">Preferred District</Label>
                              <Select value={pendingDistrict} onValueChange={setPendingDistrict}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any</SelectItem>
                                  {districtOptions.map((d) => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="mb-5">
                              <Label className="mb-2 block">Female Only</Label>
                              <Select value={pendingFemaleOnly} onValueChange={setPendingFemaleOnly}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any</SelectItem>
                                  <SelectItem value="female">Female Only</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="mb-5">
                              <Label className="mb-2 block">Preferred Type</Label>
                              <Select value={pendingType} onValueChange={setPendingType}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any</SelectItem>
                                  <SelectItem value="APARTMENT">Apartment</SelectItem>
                                  <SelectItem value="STUDIO">Studio</SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex gap-3">
                              <Button onClick={handleApplyFilters} className="flex-1">Apply Filters</Button>
                              <Button variant="outline" className="flex-1" onClick={() => { setPendingUniversity("any"); setPendingDistrict("any"); setPendingFemaleOnly("any"); setPendingType("any"); }}>Reset</Button>
                            </div>
                          </div>
                        </motion.div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>

                {/* Create Post */}
                <Card>
                  <CardHeader>
                    <CardTitle>Create Roommate Post</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form className="space-y-4" onSubmit={handleCreatePost}>
                      <div>
                        <Label htmlFor="maxBudget">Max Budget (SAR/mo)</Label>
                        <Input id="maxBudget" type="number" value={maxBudget as any} onChange={(e) => setMaxBudget(Number(e.target.value))} />
                      </div>
                      <div>
                        <Label>Preferred Type</Label>
                        <Select value={preferredType ?? ""} onValueChange={(v: string) => setPreferredType((v || null) as "APARTMENT" | "STUDIO" | "OTHER" | null)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="APARTMENT">Apartment</SelectItem>
                            <SelectItem value="STUDIO">Studio</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>University</Label>
                          <Select value={university} onValueChange={setUniversity}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {universities.map((u) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>District</Label>
                          <Select value={district} onValueChange={setDistrict}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {districtOptions.map((d) => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="femaleOnly" checked={femaleOnly} onCheckedChange={setFemaleOnly} />
                        <Label htmlFor="femaleOnly">Female Only</Label>
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" placeholder="Anything important about your preferences" value={notes} onChange={(e) => setNotes(e.target.value)} />
                      </div>
                      {error && <div className="text-red-600 text-sm">{error}</div>}
                      <Button type="submit" disabled={creating}>
                        {creating ? "Creating..." : "Create Post"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Posts List */}
              <div className="flex-1">
                <div className="mb-4">
                  <p className="text-muted-foreground text-sm">
                    {loadingPosts ? "Loading posts..." : `${filteredPosts.length} roommate posts found`}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {filteredPosts.map((p) => (
                    <Card key={p.id} className="overflow-hidden cursor-pointer" onClick={() => { setSelectedPost(p); setRequestNotes(""); setRequestError(null); setRequestSuccess(null); }}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-foreground">
                              {(p.author?.first_name || p.author?.username) ?? "Roommate"}
                            </h3>
                            <p className="text-sm text-muted-foreground">{p.university || "—"}</p>
                          </div>
                          {p.female_only && (<Badge className="bg-purple-600 hover:bg-purple-700">Female Only</Badge>)}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">District: {p.district || "—"}</div>
                        <div className="mb-3">
                          <span className="text-sm text-muted-foreground">Max Budget: </span>
                          <span className="text-primary">{Number(p.max_budget).toLocaleString()} SAR/mo</span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">Preferred Type: {p.preferred_type || "Any"}</div>
                        {p.notes && (
                          <div className="text-sm text-muted-foreground mb-4">{p.notes}</div>
                        )}
                        <div className="flex gap-3">
                          <Button variant="secondary" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onNavigate("messages"); }}>Message</Button>
                          {currentUser?.id === p.author?.id && (
                            <Button variant="outline" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleDeletePost(p.id); }}>Delete</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* My Group Tab */}
          <TabsContent value="group">
            <div>
              <div className="mb-4">
                <p className="text-muted-foreground text-sm">
                  {loadingGroups ? "Loading groups..." : `${myGroups.length} groups`}
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {myGroups.map((g) => (
                  <Card key={g.id} className="cursor-pointer" onClick={() => setSelectedGroup(g)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-foreground">{g.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="text-sm text-muted-foreground mb-2">University: {g.university || "—"}</div>
                      <div className="text-sm text-muted-foreground mb-2">Members: {(g.members || []).map((m) => formatName(m)).join(", ") || "—"}</div>
                      {g.female_only && (<Badge className="bg-purple-600 hover:bg-purple-700">Female Only</Badge>)}
                      <div className="mt-4">
                        <Button onClick={() => onNavigate("messages")} className="w-full">Open Conversation</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <div>
              <div className="mb-4">
                <p className="text-muted-foreground text-sm">
                  {loadingRequests ? "Loading requests..." : `${requestsList.length} requests`}
                </p>
                {requestsError && <p className="text-red-600 text-sm">{requestsError}</p>}
              </div>
              {(() => {
                const { received, sent } = splitRequests();
                return (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-foreground">Received</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {received.length === 0 && (
                          <p className="text-sm text-muted-foreground">No requests received.</p>
                        )}
                        {received.map((r) => (
                          <div key={r.id} className="border rounded-md p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-sm text-muted-foreground">From: {formatName(r.sender)}</div>
                                {r.post && <div className="text-sm text-muted-foreground">Post: {r.post.university || "—"} • {r.post.district || "—"}</div>}
                                {r.notes && <div className="text-sm text-muted-foreground mt-2">{r.notes}</div>}
                              </div>
                              <Badge variant={r.status === "PENDING" ? "secondary" : "default"}>{r.status}</Badge>
                            </div>
                            {r.status === "PENDING" && (
                              <div className="flex gap-3 mt-3">
                                <Button onClick={() => handleAccept(r.id)} className="bg-green-600 hover:bg-green-700">Accept</Button>
                                <Button variant="outline" onClick={() => handleReject(r.id)}>Reject</Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-foreground">Sent</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {sent.length === 0 && (
                          <p className="text-sm text-muted-foreground">No requests sent.</p>
                        )}
                        {sent.map((r) => (
                          <div key={r.id} className="border rounded-md p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-sm text-muted-foreground">To: {formatName(r.receiver_details as User)}</div>
                                {r.post && <div className="text-sm text-muted-foreground">Post: {r.post.university || "—"} • {r.post.district || "—"}</div>}
                                {r.notes && <div className="text-sm text-muted-foreground mt-2">{r.notes}</div>}
                              </div>
                              <Badge variant={r.status === "PENDING" ? "secondary" : "default"}>{r.status}</Badge>
                            </div>
                            <div className="flex gap-3 mt-3">
                              {r.status === "PENDING" && (
                                <Button variant="outline" onClick={() => handleDelete(r.id)}>Delete</Button>
                              )}
                              {r.status === "REJECTED" && (
                                <Button variant="outline" onClick={() => handleDelete(r.id)}>Dismiss</Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </div>
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <Dialog open={!!selectedPost} onOpenChange={(open: boolean) => { if (!open) { setSelectedPost(null); setRequestNotes(""); setRequestError(null); setRequestSuccess(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Roommate Details</DialogTitle>
            </DialogHeader>
            {selectedPost && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-foreground">{(selectedPost.author?.first_name || selectedPost.author?.username) ?? "Roommate"}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPost.university || "—"}</p>
                  </div>
                  {selectedPost.female_only && (<Badge className="bg-purple-600 hover:bg-purple-700">Female Only</Badge>)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>District: {selectedPost.district || "—"}</div>
                  <div>Max Budget: <span className="text-primary">{Number(selectedPost.max_budget).toLocaleString()} SAR/mo</span></div>
                  <div className="col-span-2">Preferred Type: {selectedPost.preferred_type || "Any"}</div>
                </div>
                {selectedPost.notes && (
                  <div className="text-sm text-muted-foreground">{selectedPost.notes}</div>
                )}
                <div>
                  <Label className="mb-2 block">Notes (optional)</Label>
                  <Textarea value={requestNotes} onChange={(e) => setRequestNotes(e.target.value)} placeholder="Introduce yourself or add context for your request" rows={4} />
                </div>
                {requestError && <div className="text-red-600 text-sm">{requestError}</div>}
                {requestSuccess && <div className="text-green-600 text-sm">{requestSuccess}</div>}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setSelectedPost(null); setRequestNotes(""); setRequestError(null); setRequestSuccess(null); }}>
                Close
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" disabled={sendingRequest || !selectedPost} onClick={handleSendRequest}>
                {sendingRequest ? "Sending..." : "Send Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Group Details Dialog */}
        <Dialog open={!!selectedGroup} onOpenChange={(open: boolean) => { if (!open) setSelectedGroup(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Group Details</DialogTitle>
            </DialogHeader>
            {selectedGroup && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-foreground">{selectedGroup.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedGroup.university || "—"}</p>
                  </div>
                  {selectedGroup.female_only && (<Badge className="bg-purple-600 hover:bg-purple-700">Female Only</Badge>)}
                </div>
                <div>
                  <Label className="mb-2 block">Members</Label>
                  <div className="space-y-2">
                    {(selectedGroup.members || []).map((m) => (
                      <div key={(m as any).id} className="flex items-center justify-between text-sm">
                        <span>{formatName(m)}</span>
                        {currentUser?.id === (selectedGroup.leader as any)?.id && currentUser?.id !== (m as any).id && (
                          <Button variant="outline" size="sm" onClick={() => handleKickMember(selectedGroup.id, (m as any).id)}>Kick</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setSelectedGroup(null)}>Close</Button>
                  <Button className="bg-red-600 hover:bg-red-700" onClick={handleLeaveSelectedGroup}>Leave Group</Button>
                  <Button onClick={() => onNavigate("messages")} className="ml-auto">Open Conversation</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
