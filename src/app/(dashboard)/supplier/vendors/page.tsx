/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Star,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

const vendorStatuses = [
  "All Status",
  "active",
  "inactive",
  "pending",
  "blocked"
];

const sortOptions = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "orders-desc", label: "Orders: High to Low" },
  { value: "value-desc", label: "Value: High to Low" },
  { value: "newest", label: "Newest First" },
];

export default function SupplierVendorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("name-asc");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [deletingVendor, setDeletingVendor] = useState<any>(null);

  // Form state for add/edit vendor
  const [vendorForm, setVendorForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    contactPerson: "",
    businessType: "",
    notes: "",
  });

  useEffect(() => {
    loadVendors();
  }, [user?.id]);

  const loadVendors = () => {
    setIsLoading(true);
    try {
      const savedVendors = localStorage.getItem(`supplier_${user?.id}_vendors`);
      if (savedVendors) {
        setVendors(JSON.parse(savedVendors));
      } else {
        // Sample vendor data
        const sampleVendors = [
          {
            id: "1",
            name: "TechVendor Pro",
            email: "contact@techvendor.com",
            phone: "+1 (555) 123-4567",
            address: "123 Tech Street, Silicon Valley, CA 94000",
            contactPerson: "John Smith",
            businessType: "Electronics Retailer",
            status: "active",
            totalOrders: 15,
            totalValue: 45000,
            lastOrder: "2024-01-20",
            rating: 4.8,
            joinedDate: "2023-06-15",
            notes: "Preferred vendor for electronics components. Always pays on time.",
          },
          {
            id: "2",
            name: "Fashion Hub",
            email: "orders@fashionhub.com", 
            phone: "+1 (555) 987-6543",
            address: "456 Fashion Ave, New York, NY 10001",
            contactPerson: "Sarah Johnson",
            businessType: "Fashion Retailer",
            status: "active",
            totalOrders: 8,
            totalValue: 22000,
            lastOrder: "2024-01-18",
            rating: 4.5,
            joinedDate: "2023-09-10",
            notes: "Specializes in organic fabrics. Good communication.",
          },
          {
            id: "3",
            name: "Industrial Solutions Inc",
            email: "procurement@industrial.com",
            phone: "+1 (555) 456-7890",
            address: "789 Industrial Blvd, Detroit, MI 48000",
            contactPerson: "Mike Wilson",
            businessType: "Manufacturing",
            status: "pending",
            totalOrders: 2,
            totalValue: 8500,
            lastOrder: "2024-01-10",
            rating: 4.0,
            joinedDate: "2024-01-05",
            notes: "New vendor, still under evaluation period.",
          }
        ];
        setVendors(sampleVendors);
        localStorage.setItem(`supplier_${user?.id}_vendors`, JSON.stringify(sampleVendors));
      }
    } catch (error) {
      toast.error("Failed to load vendors");
      console.error("Error loading vendors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveVendors = (updatedVendors: any[]) => {
    setVendors(updatedVendors);
    localStorage.setItem(`supplier_${user?.id}_vendors`, JSON.stringify(updatedVendors));
  };

  // Filter and sort vendors
  const filteredAndSortedVendors = useMemo(() => {
    const filtered = vendors.filter((vendor: any) => {
      const matchesSearch =
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.businessType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === "All Status" || vendor.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    // Sort vendors
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "orders-desc":
          return b.totalOrders - a.totalOrders;
        case "value-desc":
          return b.totalValue - a.totalValue;
        case "newest":
          return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [vendors, searchTerm, selectedStatus, sortBy]);

  const resetForm = () => {
    setVendorForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      contactPerson: "",
      businessType: "",
      notes: "",
    });
  };

  const handleAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleEdit = (vendor: any) => {
    setEditingVendor(vendor);
    setVendorForm({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      contactPerson: vendor.contactPerson,
      businessType: vendor.businessType,
      notes: vendor.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleSaveAdd = () => {
    const newVendor = {
      id: Date.now().toString(),
      ...vendorForm,
      status: "pending",
      totalOrders: 0,
      totalValue: 0,
      lastOrder: null,
      rating: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    const updatedVendors = [...vendors, newVendor];
    saveVendors(updatedVendors);
    setIsAddOpen(false);
    resetForm();
    toast.success("Vendor added successfully!");
  };

  const handleSaveEdit = () => {
    if (!editingVendor) return;

    const updatedVendor = {
      ...editingVendor,
      ...vendorForm,
    };

    const updatedVendors = vendors.map((v: any) =>
      v.id === editingVendor.id ? updatedVendor : v
    );
    saveVendors(updatedVendors);
    setIsEditOpen(false);
    setEditingVendor(null);
    resetForm();
    toast.success("Vendor updated successfully!");
  };

  const handleDelete = (vendor: any) => {
    setDeletingVendor(vendor);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingVendor) return;

    const updatedVendors = vendors.filter((v: any) => v.id !== deletingVendor.id);
    saveVendors(updatedVendors);
    setIsDeleteOpen(false);
    setDeletingVendor(null);
    toast.success("Vendor deleted successfully!");
  };

  const handleStatusToggle = (vendor: any) => {
    const newStatus = vendor.status === "active" ? "inactive" : "active";
    const updatedVendors = vendors.map((v: any) =>
      v.id === vendor.id ? { ...v, status: newStatus } : v
    );
    saveVendors(updatedVendors);
    toast.success(`Vendor ${newStatus === "active" ? "activated" : "deactivated"}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "blocked":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v: any) => v.status === "active").length;
  const pendingVendors = vendors.filter((v: any) => v.status === "pending").length;
  const totalOrders = vendors.reduce((sum: number, v: any) => sum + v.totalOrders, 0);
  const totalValue = vendors.reduce((sum: number, v: any) => sum + v.totalValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendor Management</h1>
          <p className="text-muted-foreground">
            Manage your vendor relationships and partnerships
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalVendors}</div>
            <p className="text-xs text-muted-foreground">Registered vendors</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Active Vendors</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeVendors}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingVendors}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">All vendors</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Revenue generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm border-border bg-background"
                />
              </div>
            </div>

            {/* Status filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-sm border-border bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {vendorStatuses.map((status) => (
                  <SelectItem key={status} value={status} className="text-sm">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 text-sm border-border bg-background">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedVendors.length} of {totalVendors} vendors
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      {filteredAndSortedVendors.length > 0 ? (
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Vendor Directory</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your vendor relationships and track performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Vendor</TableHead>
                    <TableHead className="text-foreground">Contact</TableHead>
                    <TableHead className="text-foreground">Business Type</TableHead>
                    <TableHead className="text-foreground">Performance</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Joined</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedVendors.map((vendor: any) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {vendor.contactPerson}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {vendor.email}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {vendor.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{vendor.businessType}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            {renderStars(vendor.rating)}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({vendor.rating.toFixed(1)})
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {vendor.totalOrders} orders • ${vendor.totalValue.toFixed(0)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(vendor.status)}
                          <Badge
                            className={`text-xs px-2 py-1 ${getStatusColor(vendor.status)}`}
                            variant="secondary"
                          >
                            {vendor.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground">
                          {new Date(vendor.joinedDate).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => toast.info("Vendor details coming soon")}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEdit(vendor)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-7 text-xs px-2 ${
                              vendor.status === "active"
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                            onClick={() => handleStatusToggle(vendor)}
                          >
                            {vendor.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(vendor)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-12 border border-border bg-card">
          <CardContent>
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {totalVendors === 0 ? "No Vendors Yet" : "No Vendors Found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {totalVendors === 0
                ? "Start by adding your first vendor to manage relationships."
                : "Try adjusting your search terms or filters."}
            </p>
            {totalVendors === 0 ? (
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Vendor
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("All Status");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Vendor Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Vendor</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new vendor to your supply chain network
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-name" className="text-foreground">Company Name *</Label>
                <Input
                  id="add-name"
                  value={vendorForm.name}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="border-border bg-background"
                  placeholder="Vendor company name"
                />
              </div>
              <div>
                <Label htmlFor="add-contact" className="text-foreground">Contact Person</Label>
                <Input
                  id="add-contact"
                  value={vendorForm.contactPerson}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, contactPerson: e.target.value }))
                  }
                  className="border-border bg-background"
                  placeholder="Primary contact name"
                />
              </div>
              <div>
                <Label htmlFor="add-business" className="text-foreground">Business Type</Label>
                <Input
                  id="add-business"
                  value={vendorForm.businessType}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, businessType: e.target.value }))
                  }
                  className="border-border bg-background"
                  placeholder="e.g., Retailer, Manufacturer"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-email" className="text-foreground">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={vendorForm.email}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="border-border bg-background"
                  placeholder="contact@vendor.com"
                />
              </div>
              <div>
                <Label htmlFor="add-phone" className="text-foreground">Phone</Label>
                <Input
                  id="add-phone"
                  value={vendorForm.phone}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="border-border bg-background"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="add-address" className="text-foreground">Address</Label>
                <Input
                  id="add-address"
                  value={vendorForm.address}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="border-border bg-background"
                  placeholder="Business address"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="add-notes" className="text-foreground">Notes</Label>
              <Textarea
                id="add-notes"
                value={vendorForm.notes}
                onChange={(e) =>
                  setVendorForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="border-border bg-background"
                placeholder="Additional notes about this vendor..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdd}>Add Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Vendor</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update vendor information
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className="text-foreground">Company Name *</Label>
                <Input
                  id="edit-name"
                  value={vendorForm.name}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="border-border bg-background"
                  placeholder="Vendor company name"
                />
              </div>
              <div>
                <Label htmlFor="edit-contact" className="text-foreground">Contact Person</Label>
                <Input
                  id="edit-contact"
                  value={vendorForm.contactPerson}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, contactPerson: e.target.value }))
                  }
                  className="border-border bg-background"
                  placeholder="Primary contact name"
                />
              </div>
              <div>
                <Label htmlFor="edit-business" className="text-foreground">Business Type</Label>
                <Input
                  id="edit-business"
                  value={vendorForm.businessType}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, businessType: e.target.value }))
                  }
                  className="border-border bg-background"
                  placeholder="e.g., Retailer, Manufacturer"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-email" className="text-foreground">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={vendorForm.email}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="border-border bg-background"
                  placeholder="contact@vendor.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone" className="text-foreground">Phone</Label>
                <Input
                  id="edit-phone"
                  value={vendorForm.phone}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="border-border bg-background"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="edit-address" className="text-foreground">Address</Label>
                <Input
                  id="edit-address"
                  value={vendorForm.address}
                  onChange={(e) =>
                    setVendorForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="border-border bg-background"
                  placeholder="Business address"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-notes" className="text-foreground">Notes</Label>
              <Textarea
                id="edit-notes"
                value={vendorForm.notes}
                onChange={(e) =>
                  setVendorForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="border-border bg-background"
                placeholder="Additional notes about this vendor..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Update Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Vendor</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete &quot;{deletingVendor?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}