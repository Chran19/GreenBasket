"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { adminDisputesAPI } from "@/lib/api"
import { Search, Filter, Eye, Edit, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface Dispute {
  id: string
  description: string
  status: string
  resolution?: string
  created_at: string
  complainant: { id: string; name: string; email: string; role: string }
  respondent: { id: string; name: string; email: string; role: string }
  resolver?: { id: string; name: string }
  order?: { id: string; total_price: number; status: string }
}

export function DisputeManagement() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [totalDisputes, setTotalDisputes] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({ status: "", search: "" })
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [resolution, setResolution] = useState("")

  const loadDisputes = async () => {
    try {
      setLoading(true)
      const params: any = { page: currentPage, limit: 20 }
      if (filters.status) params.status = filters.status

      const response = await adminDisputesAPI.getAll(params)
      const data = response.data || []
      setDisputes(data)
      setTotalDisputes(response.pagination?.total || 0)
    } catch (error) {
      console.error("Failed to load disputes:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDisputes()
  }, [currentPage, filters])

  const handleStatusUpdate = async () => {
    if (!selectedDispute || !newStatus) return

    try {
      await adminDisputesAPI.updateStatus(selectedDispute.id, newStatus, resolution)
      setStatusUpdateDialog(false)
      setNewStatus("")
      setResolution("")
      setSelectedDispute(null)
      loadDisputes()
    } catch (error) {
      console.error("Failed to update dispute status:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: "bg-red-100 text-red-800", icon: AlertTriangle, label: "Open" },
      in_progress: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "In Progress" },
      resolved: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Resolved" },
      closed: { color: "bg-gray-100 text-gray-800", icon: CheckCircle, label: "Closed" },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const totalPages = Math.ceil(totalDisputes / 20)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search disputes..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
  value={filters.status || "all"}
  onValueChange={(value) =>
    setFilters({ ...filters, status: value === "all" ? "" : value })
  }
>
  <SelectTrigger>
    <SelectValue placeholder="All Status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Status</SelectItem>
    <SelectItem value="open">Open</SelectItem>
    <SelectItem value="in_progress">In Progress</SelectItem>
    <SelectItem value="resolved">Resolved</SelectItem>
    <SelectItem value="closed">Closed</SelectItem>
  </SelectContent>
</Select>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Disputes ({totalDisputes})</h2>
          <p className="text-muted-foreground">Handle customer disputes and issues</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {disputes.filter(d => d.status === "open").length} Open
          </Badge>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {disputes.filter(d => d.status === "in_progress").length} In Progress
          </Badge>
        </div>
      </div>

      {/* Disputes Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading disputes...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Dispute ID</th>
                    <th className="text-left p-4 font-medium">Complainant</th>
                    <th className="text-left p-4 font-medium">Respondent</th>
                    <th className="text-left p-4 font-medium">Description</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} className="border-b">
                      <td className="p-4 font-mono text-sm">{dispute.id}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{dispute.complainant.name}</p>
                          <p className="text-sm text-muted-foreground">{dispute.complainant.email}</p>
                          <Badge variant="outline" className="text-xs">
                            {dispute.complainant.role}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{dispute.respondent.name}</p>
                          <p className="text-sm text-muted-foreground">{dispute.respondent.email}</p>
                          <Badge variant="outline" className="text-xs">
                            {dispute.respondent.role}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs">
                          <p className="text-sm line-clamp-2">{dispute.description}</p>
                          {dispute.order && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Order: {dispute.order.id} (₹{dispute.order.total_price})
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(dispute.status)}</td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Dispute Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium">Complainant</h4>
                                    <div className="bg-muted/50 p-3 rounded">
                                      <p className="font-medium">{dispute.complainant.name}</p>
                                      <p className="text-sm text-muted-foreground">{dispute.complainant.email}</p>
                                      <Badge variant="outline" className="text-xs">
                                        {dispute.complainant.role}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Respondent</h4>
                                    <div className="bg-muted/50 p-3 rounded">
                                      <p className="font-medium">{dispute.respondent.name}</p>
                                      <p className="text-sm text-muted-foreground">{dispute.respondent.email}</p>
                                      <Badge variant="outline" className="text-xs">
                                        {dispute.respondent.role}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                
                                {dispute.order && (
                                  <div>
                                    <h4 className="font-medium">Related Order</h4>
                                    <div className="bg-muted/50 p-3 rounded">
                                      <p className="font-medium">Order ID: {dispute.order.id}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Total: ₹{dispute.order.total_price} | Status: {dispute.order.status}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <h4 className="font-medium">Description</h4>
                                  <div className="bg-muted/50 p-3 rounded">
                                    <p className="text-sm">{dispute.description}</p>
                                  </div>
                                </div>

                                {dispute.resolution && (
                                  <div>
                                    <h4 className="font-medium">Resolution</h4>
                                    <div className="bg-green-50 p-3 rounded border border-green-200">
                                      <p className="text-sm">{dispute.resolution}</p>
                                      {dispute.resolver && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Resolved by: {dispute.resolver.name}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          {(dispute.status === "open" || dispute.status === "in_progress") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDispute(dispute)
                                setNewStatus(dispute.status)
                                setResolution(dispute.resolution || "")
                                setStatusUpdateDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Dispute Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Resolution (Required for Resolved status)</label>
              <Textarea
                placeholder="Add resolution details..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusUpdateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleStatusUpdate}
                disabled={newStatus === "resolved" && !resolution.trim()}
              >
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
