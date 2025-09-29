import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getSalesWithAnimals } from '@/services/animal/animalSalesService';
import { formatCostPerSqm } from '@/utils/financialFormatters';
import SaleDetailsDialog from '@/components/dialogs/SaleDetailsDialog';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  TrendingUp,
  FileText,
  Download
} from 'lucide-react';

const SalesHistoryView: React.FC = () => {
  const { toast } = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  // Summary stats
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averagePrice: 0,
    outstandingAmount: 0
  });

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, statusFilter]);

  useEffect(() => {
    calculateStats();
  }, [sales]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const salesData = await getSalesWithAnimals();
      setSales(salesData);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar el historial de ventas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = [...sales];

    // Filter by search term (buyer name, animal name, or ID)
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.animals?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by payment status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.payment_status === statusFilter);
    }

    setFilteredSales(filtered);
  };

  const calculateStats = () => {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.sale_price, 0);
    const averagePrice = totalSales > 0 ? totalRevenue / totalSales : 0;
    const outstandingAmount = sales.reduce((sum, sale) => sum + sale.amount_pending, 0);

    setStats({
      totalSales,
      totalRevenue,
      averagePrice,
      outstandingAmount
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      case 'pending':
        return <Badge className="bg-red-100 text-red-800">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold">Historial de Ventas</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold">Historial de Ventas</h1>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCostPerSqm(stats.totalRevenue)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCostPerSqm(stats.averagePrice)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendiente Cobro</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCostPerSqm(stats.outstandingAmount)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por comprador, animal o ID de venta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="partial">Pago Parcial</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Ventas ({filteredSales.length} {filteredSales.length === 1 ? 'registro' : 'registros'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length > 0 ? (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedSaleId(sale.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium">
                          Venta #{sale.id.slice(-8)}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(sale.sale_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {sale.buyer_name}
                          </span>
                          {sale.animals?.name && (
                            <span>Animal: {sale.animals.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-purple-600">
                          {formatCostPerSqm(sale.sale_price)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Pagado: {formatCostPerSqm(sale.amount_paid)}
                        </p>
                        {sale.amount_pending > 0 && (
                          <p className="text-sm text-red-600">
                            Pendiente: {formatCostPerSqm(sale.amount_pending)}
                          </p>
                        )}
                      </div>
                      {getPaymentStatusBadge(sale.payment_status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron ventas que coincidan con los filtros</p>
              {(searchTerm || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="mt-4"
                >
                  Limpiar Filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sale Details Dialog */}
      {selectedSaleId && (
        <SaleDetailsDialog
          isOpen={!!selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
          saleId={selectedSaleId}
        />
      )}
    </div>
  );
};

export default SalesHistoryView;