import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { orderService } from "@/services/dataService";
import { useRequireAuth } from "@/hooks/useAuth";
import { Search, Filter, Eye, CheckCircle, Clock, Package, Truck, AlertCircle, LucideIcon, ArrowLeft, ShieldCheck, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

import LanyardOrderDetailsModal from "@/components/admin/LanyardOrderDetailsModal";

interface OrderWithDetails {
  _id: string;
  project: Record<string, unknown>;
  creator: Record<string, unknown>;
  template: Record<string, unknown>;
  status: string;
  createdAt: string;
  student_count: number;
  created_by?: string;
}

const OrderManagement = () => {
  const { user, isLoading: isLoadingAuth } = useRequireAuth("/admin/login");
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedOrderModal, setSelectedOrderModal] = useState<OrderWithDetails | null>(null);

  const isSuperAdmin = user?.role === 'super-admin' || user?.role === 'ultra-super-admin';

  const statusConfig: Record<string, { label: string; color: string; icon: LucideIcon }> = {
    draft: { label: "Draft", color: "bg-gray-500", icon: Clock },
    submitted: { label: "Submitted", color: "bg-yellow-500", icon: Package },
    uploaded: { label: "Uploaded", color: "bg-blue-500", icon: AlertCircle },
    validated: { label: "Validated", color: "bg-purple-500", icon: CheckCircle },
    generated: { label: "Generated", color: "bg-green-500", icon: CheckCircle },
    exported: { label: "Exported", color: "bg-emerald-500", icon: Truck },
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const ordersData = await orderService.getAll();
        const list = Array.isArray(ordersData) ? ordersData : [];

        const ordersWithDetails = list.map((order: Record<string, unknown>) => ({
          ...order,
          _id: (order._id || order.id || '') as string,
          student_count: (order.studentCount || order.student_count || 100) as number,
          creator: (order.creator || {}) as Record<string, unknown>,
          project: (order.project || {}) as Record<string, unknown>,
          template: (order.template || {}) as Record<string, unknown>,
        })) as OrderWithDetails[];

        setOrders(ordersWithDetails);
        setFilteredOrders(ordersWithDetails);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Extract unique admins for Super Admin filter
  const uniqueAdmins = Array.from(
    new Map(
      orders
        .map(o => {
          const adminId = (o.creator?.id || o.created_by || 'Unknown') as string;
          const adminName = (o.creator?.name || 'Admin') as string;
          const adminEmail = (o.creator?.email || '') as string;
          return [adminId, { id: adminId, name: adminName, email: adminEmail }];
        })
    ).values()
  );

  useEffect(() => {
    let filtered = [...orders];

    // For regular admins, strictly restrict to orders where created_by or creator.id matches user.id or user.email
    if (!isSuperAdmin && user) {
      filtered = filtered.filter(order => {
        const creatorId = order.creator?.id || order.created_by;
        const creatorEmail = order.creator?.email;
        return creatorId === user.id || creatorId === user._id || (creatorEmail && creatorEmail.toLowerCase() === user.email.toLowerCase());
      });
    }

    // Apply search filter (order ID, admin ID, creator name/email, project name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const orderId = (order._id || '').toLowerCase();
        const adminId = ((order.creator?.id as string) || (order.created_by as string) || '').toLowerCase();
        const creatorName = ((order.creator?.name as string) || '').toLowerCase();
        const creatorEmail = ((order.creator?.email as string) || '').toLowerCase();
        const projectName = ((order.project?.name as string) || '').toLowerCase();
        const org = ((order.project?.organization as string) || '').toLowerCase();

        return (
          orderId.includes(term) ||
          adminId.includes(term) ||
          creatorName.includes(term) ||
          creatorEmail.includes(term) ||
          projectName.includes(term) ||
          org.includes(term)
        );
      });
    }

    // Apply admin filter for Super Admin
    if (isSuperAdmin && adminFilter !== "all") {
      filtered = filtered.filter(order => {
        const creatorId = order.creator?.id || order.created_by;
        return creatorId === adminFilter;
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number | string | Date, bValue: number | string | Date;
      
      switch (sortBy) {
        case "total_students":
          aValue = a.student_count;
          bValue = b.student_count;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, adminFilter, sortBy, sortOrder, isSuperAdmin, user]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateStatus(orderId, newStatus);

      // Update local state
      setOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));

      toast.success(`Order status updated to ${statusConfig[newStatus]?.label || newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const formatDateLocal = (dateString: string) => {
    return formatDate(dateString);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status];
    if (!config) return <Badge>{status}</Badge>;

    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white font-bold`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (isLoadingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading orders...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
        <Card className="mb-6 border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">
                    {isSuperAdmin ? "Order Management (All Admin Orders)" : "My Admin Orders"}
                  </CardTitle>
                  {isSuperAdmin ? (
                    <Badge className="bg-amber-600 text-white font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Super Admin View
                    </Badge>
                  ) : (
                    <Badge className="bg-indigo-600 text-white font-bold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Admin View
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  {isSuperAdmin
                    ? "Viewing all lanyard orders placed by all admins across the platform with their Admin IDs."
                    : `Viewing orders placed under your Admin Account (Admin ID: ${user?.id || user?._id || 'N/A'})`
                  }
                </CardDescription>
              </div>

              {!isSuperAdmin && user && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 text-xs">
                  <span className="text-indigo-500 font-extrabold block">Your Admin ID</span>
                  <span className="font-mono font-bold text-indigo-900">{user.id || user._id}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isSuperAdmin ? "Search by Order ID, Admin ID, Admin Name/Email, Project..." : "Search by Order ID or Project..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {isSuperAdmin && (
                <Select value={adminFilter} onValueChange={setAdminFilter}>
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Filter by Admin ID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Admins</SelectItem>
                    {uniqueAdmins.map(admin => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.name} ({admin.id.slice(0, 8)}...)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                  <SelectItem value="validated">Validated</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="exported">Exported</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Order Date</SelectItem>
                  <SelectItem value="total_students">Student Count</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
              <span>Showing {filteredOrders.length} of {orders.length} orders</span>
              {isSuperAdmin && (
                <span className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                  Super Admin: {uniqueAdmins.length} Admins Active
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-extrabold text-slate-700">Order ID</TableHead>
                    {isSuperAdmin && <TableHead className="font-extrabold text-slate-700">Admin ID / Creator</TableHead>}
                    <TableHead className="font-extrabold text-slate-700">Project Name</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Organization</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Template</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Quantity</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Status</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Created</TableHead>
                    <TableHead className="font-extrabold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const creatorId = (order.creator?.id || order.created_by || 'N/A') as string;
                    const creatorName = (order.creator?.name || 'Admin') as string;
                    const creatorEmail = (order.creator?.email || 'N/A') as string;
                    const creatorOrg = (order.creator?.organization || 'GoTek') as string;

                    return (
                      <TableRow 
                        key={order._id}
                        className="cursor-pointer hover:bg-indigo-50/40 transition-colors border-b border-slate-100"
                        onClick={() => setSelectedOrderModal(order)}
                      >
                        <TableCell>
                          <div className="font-mono text-xs font-bold text-indigo-600">
                            {order._id.slice(0, 12)}...
                          </div>
                        </TableCell>
                        
                        {isSuperAdmin && (
                          <TableCell>
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-100 text-amber-900 rounded-md border border-amber-200">
                                ID: {creatorId.slice(0, 10)}...
                              </span>
                              <div className="text-xs font-bold text-slate-800">{creatorName}</div>
                              <div className="text-[10px] text-slate-500">{creatorEmail}</div>
                            </div>
                          </TableCell>
                        )}

                        <TableCell>
                          <div className="text-xs font-bold text-slate-800">
                            {(order.project as any)?.name || "Lanyard Project"}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-xs text-slate-600">
                            {(order.project as any)?.organization || creatorOrg || "GoTek Org"}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-xs text-slate-600">
                            {(order.template as any)?.name || "Lanyard"}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-xs font-extrabold text-indigo-600">
                            {order.student_count || 100} Units
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-xs text-slate-600">
                            {formatDateLocal(order.createdAt)}
                          </div>
                        </TableCell>
                        
                        <TableCell onClick={e => e.stopPropagation()} className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold text-xs"
                              onClick={() => setSelectedOrderModal(order)}
                              title="View Full Lanyard Specifications"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View Specs
                            </Button>
                            
                            <Select
                              value={order.status}
                              onValueChange={(newStatus) => handleStatusUpdate(order._id, newStatus)}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="uploaded">Uploaded</SelectItem>
                                <SelectItem value="validated">Validated</SelectItem>
                                <SelectItem value="generated">Generated</SelectItem>
                                <SelectItem value="exported">Exported</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {filteredOrders.length === 0 && (
          <Card className="mt-6">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground text-sm">
                {searchTerm || statusFilter !== "all" || adminFilter !== "all"
                  ? "No orders match your current filters." 
                  : "No orders have been created yet under this admin account."
                }
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details Specification Modal Popup */}
        <LanyardOrderDetailsModal
          isOpen={!!selectedOrderModal}
          onClose={() => setSelectedOrderModal(null)}
          order={selectedOrderModal}
          onStatusUpdate={handleStatusUpdate}
        />
      </main>
    </div>
  );
};

export default OrderManagement;
