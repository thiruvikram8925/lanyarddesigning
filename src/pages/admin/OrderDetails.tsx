import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Package, CheckCircle, AlertCircle, Truck, Info, Settings, ShieldAlert, FileText, Image as ImageIcon } from "lucide-react";
import { orderService, projectService } from "@/services/dataService";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";
import ExportMode from "@/components/customizer/workspace/ExportMode";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-gray-500", icon: Clock },
  submitted: { label: "Submitted", color: "bg-yellow-500", icon: Package },
  uploaded: { label: "Uploaded", color: "bg-blue-500", icon: AlertCircle },
  validated: { label: "Validated", color: "bg-purple-500", icon: CheckCircle },
  generated: { label: "Generated", color: "bg-green-500", icon: CheckCircle },
  exported: { label: "Exported", color: "bg-emerald-500", icon: Truck },
};

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [design, setDesign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (!id) return;
        setIsLoading(true);
        const allOrders = await orderService.getAll();
        const currentOrder = allOrders.find((o: any) => o._id === id || o.id === id);
        
        if (!currentOrder) {
          toast.error("Order not found");
          setIsLoading(false);
          return;
        }

        setOrder(currentOrder);
        const projectId = currentOrder.projectId || currentOrder.project?.id;

        if (projectId) {
          const projectData = await projectService.getById(projectId);
          setProject(projectData);

          if (projectData && projectData.design_state) {
            try {
              const parsedDesign = JSON.parse(projectData.design_state);
              setDesign(parsedDesign);
              useConfiguratorStore.setState({ design: parsedDesign });
            } catch (e) {
              console.error("Failed to parse design state", e);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate("/admin/orders")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
          </Button>
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Order not found.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const orderStatus = statusConfig[order.status] || { label: order.status, color: "bg-gray-500", icon: Clock };
  const StatusIcon = orderStatus.icon;

  // Visual Assets
  const logoUrl = design?.logoUrl;
  const customPatternUrl = design?.customPatternUrl;
  const frontImage = design?.idCard?.front?.backgroundImage || design?.idCard?.photoUrl;
  const backImage = design?.idCard?.back?.backgroundImage;

  // Details checklists
  const lanyardAccessories = Array.isArray(design?.accessories) ? design.accessories : [];
  const cardFrontElements = Array.isArray(design?.idCard?.front?.elements) ? design.idCard.front.elements : [];
  const cardBackElements = Array.isArray(design?.idCard?.back?.elements) ? design.idCard.back.elements : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 pb-12">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/admin/orders")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Order / Customer Info */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="shadow-md">
              <CardHeader className="bg-muted/40 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  Order Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order ID</div>
                  <div className="font-mono text-sm break-all font-semibold bg-slate-50 p-2 rounded border mt-1">
                    {order._id || order.id}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</div>
                  <Badge className={`${orderStatus.color} text-white mt-1.5 px-3 py-1 text-xs`}>
                    <StatusIcon className="w-3.5 h-3.5 mr-1" />
                    {orderStatus.label}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Created At</div>
                  <div className="text-sm font-semibold">{formatDate(order.createdAt || order.created_at)}</div>
                </div>
                {project && (
                  <>
                    <div className="border-t pt-3">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project / School Name</div>
                      <div className="text-sm font-semibold mt-0.5">{project.name}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Organization</div>
                      <div className="text-sm font-semibold mt-0.5">{project.organization}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Created By</div>
                      <div className="text-sm font-semibold mt-0.5">{project.created_by}</div>
                    </div>
                  </>
                )}
                
                <div className="pt-4 border-t">
                  <Button 
                    className="w-full font-bold shadow" 
                    variant="default"
                    onClick={() => {
                      const projectId = order.projectId || order.project?.id;
                      if (projectId) {
                        navigate(`/customizer?orderId=${projectId}`);
                      }
                    }}
                  >
                    Open Workspace
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Design Spec Highlights */}
            {design && (
              <Card className="shadow-md">
                <CardHeader className="bg-muted/40 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 pt-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Print Method</span>
                      <span className="font-semibold">{design.printingMethod || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Lanyard Style</span>
                      <span className="font-semibold">{design.lanyardStyle || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Strap Width</span>
                      <span className="font-semibold">{design.width || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Strap Color</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div 
                          className="w-3.5 h-3.5 rounded-full border border-slate-300" 
                          style={{ backgroundColor: design.lanyardColor || design.customColorCode || "#fff" }} 
                        />
                        <span className="font-mono text-xs font-semibold">{design.lanyardColor || design.customColorCode || "#ffffff"}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Hardware / Clip</span>
                      <span className="font-semibold">{design.clipType || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Quantity</span>
                      <span className="font-semibold">{design.quantity ?? "N/A"}</span>
                    </div>
                  </div>

                  {lanyardAccessories.length > 0 && (
                    <div className="border-t pt-3.5">
                      <span className="text-xs text-muted-foreground block mb-1">Strap Accessories</span>
                      <div className="flex flex-wrap gap-1.5">
                        {lanyardAccessories.map((acc: string) => (
                          <Badge key={acc} variant="secondary" className="text-xs">
                            {acc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Custom Text + Visual Assets */}
          <div className="lg:col-span-2 space-y-6">
            {design && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Lanyard Text Configurations
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block">Design Style</span>
                    <span className="font-semibold capitalize">{design.lanyardDesignStyle || "Repeated"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Font Settings</span>
                    <span className="font-semibold">{design.fontFamily || "Montserrat"} ({design.fontSize || 18}px)</span>
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Left Text</span>
                      <span className="text-sm font-semibold">{design.customTextLeft || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Center Text</span>
                      <span className="text-sm font-semibold">{design.customTextCenter || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Right Text</span>
                      <span className="text-sm font-semibold">{design.customTextRight || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Secondary Text</span>
                      <span className="text-sm font-semibold">{design.customTextSecondary || "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Design & Asset Previews */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  Design Previews & Assets
                </CardTitle>
                <CardDescription>Visual design assets uploaded or configured for this project</CardDescription>
              </CardHeader>
              <CardContent>
                {!logoUrl && !customPatternUrl && !frontImage && !backImage ? (
                  <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                    <ShieldAlert className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    No custom design images or logo assets are available for this order.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* ID Card Front/Back Background Previews */}
                    {(frontImage || backImage) && (
                      <div className="border-b pb-6">
                        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-4">ID Card Templates</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {frontImage && (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-muted-foreground block text-center">Card Front Background</span>
                              <div className="border rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center p-3 h-[300px]">
                                <img src={frontImage} alt="Card Front" className="max-w-full max-h-full object-contain" />
                              </div>
                            </div>
                          )}
                          {backImage && (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-muted-foreground block text-center">Card Back Background</span>
                              <div className="border rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center p-3 h-[300px]">
                                <img src={backImage} alt="Card Back" className="max-w-full max-h-full object-contain" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Logo and Patterns */}
                    {(logoUrl || customPatternUrl) && (
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-4">Uploaded Customizer Assets</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {logoUrl && (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-muted-foreground block text-center">Strap Logo Asset</span>
                              <div className="border rounded-xl overflow-hidden bg-slate-50 shadow-sm flex items-center justify-center p-4 h-[200px]">
                                <img src={logoUrl} alt="Lanyard Logo" className="max-w-full max-h-full object-contain" />
                              </div>
                              <span className="text-[10px] text-center text-muted-foreground block">
                                Logo Name: {design?.logoName || "Uploaded Logo"}
                              </span>
                            </div>
                          )}
                          {customPatternUrl && (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-muted-foreground block text-center">Custom Pattern Tile</span>
                              <div className="border rounded-xl overflow-hidden bg-slate-50 shadow-sm flex items-center justify-center p-4 h-[200px]">
                                <img src={customPatternUrl} alt="Custom Pattern" className="max-w-full max-h-full object-contain" />
                              </div>
                              <span className="text-[10px] text-center text-muted-foreground block">
                                Pattern Name: {design?.customPatternName || "Custom Pattern"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configured ID Card Layer Details */}
            {design?.idCard && (cardFrontElements.length > 0 || cardBackElements.length > 0) && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    ID Card Designed Layers
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {cardFrontElements.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-indigo-700 uppercase tracking-wide">Front Side Layers ({cardFrontElements.length})</h4>
                      <div className="bg-slate-50 border rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-1">
                        {cardFrontElements.map((el: any) => (
                          <div key={el.id} className="text-xs flex justify-between py-1 border-b last:border-b-0 border-slate-200">
                            <span className="font-semibold capitalize text-slate-700">{el.type}</span>
                            <span className="text-muted-foreground font-mono text-[10px]">{el.content || el.shapeType || "No Content"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {cardBackElements.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-indigo-700 uppercase tracking-wide">Back Side Layers ({cardBackElements.length})</h4>
                      <div className="bg-slate-50 border rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-1">
                        {cardBackElements.map((el: any) => (
                          <div key={el.id} className="text-xs flex justify-between py-1 border-b last:border-b-0 border-slate-200">
                            <span className="font-semibold capitalize text-slate-700">{el.type}</span>
                            <span className="text-muted-foreground font-mono text-[10px]">{el.content || el.shapeType || "No Content"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Export Panel embedded directly in Order Details */}
            {design && (
              <Card className="shadow-md overflow-hidden border-indigo-100">
                <ExportMode hidePreview={true} />
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetails;
