import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput,
  SafeAreaView,
} from 'react-native';

const API_URL = 'https://backend-barberia-gamma.vercel.app';

const BarberiaApp = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${API_URL}/reservas`);
      const data = await res.json();

      const transformed = data.map(r => ({
        id: r.id_reserva,
        customerName: r.cliente_nombre,
        customerEmail: r.correo,
        customerPhone: r.telefono,
        service: r.servicio_nombre,
        servicePrice: `$${Number(r.servicio_precio).toLocaleString('es-CO')}`,
        barber: r.barbero_nombre,
        date: new Date(r.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: r.hora.substring(0, 5),
        status: r.estado.toLowerCase(),
        createdAt: null
      }));

      setAppointments(transformed);
    } catch (error) {
      console.error('Error cargando reservas:', error);
      Alert.alert('Error', 'No se pudieron cargar las reservas.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments().finally(() => setRefreshing(false));
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const method = newStatus === 'cancelada' ? 'DELETE' : 'PUT';
      const res = await fetch(`${API_URL}/reservas/${appointmentId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'PUT' ? JSON.stringify({ estado: newStatus }) : null
      });

      if (!res.ok) throw new Error('Error actualizando');

      fetchAppointments();
      setModalVisible(false);
    } catch (error) {
      console.error('Error actualizando reserva:', error);
      Alert.alert('Error', 'No se pudo actualizar la reserva.');
    }
  };

  const deleteAppointment = async (appointmentId) => {
    Alert.alert('Eliminar Cita', '¿Estás seguro de que quieres eliminar esta cita?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/reservas/${appointmentId}`, { method: 'DELETE' });
            fetchAppointments();
            setModalVisible(false);
          } catch (error) {
            console.error('Error al eliminar cita:', error);
            Alert.alert('Error', 'No se pudo eliminar la cita.');
          }
        }
      }
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmada': return '#4CAF50';
      case 'cancelada': return '#F44336';
      
      default: return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmada': return 'Confirmada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filterStatus === 'todas' || appointment.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      appointment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.barber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.service.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const AppointmentItem = ({ appointment }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => {
        setSelectedAppointment(appointment);
        setModalVisible(true);
      }}
    >
      <View style={styles.appointmentHeader}>
        <Text style={styles.customerName}>{appointment.customerName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
          <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
        </View>
      </View>
      <View style={styles.appointmentDetails}>
        <Text style={styles.serviceText}>{appointment.service}</Text>
        <Text style={styles.priceText}>{appointment.servicePrice}</Text>
      </View>
      <View style={styles.appointmentFooter}>
        <Text style={styles.barberText}>👤 {appointment.barber}</Text>
        <Text style={styles.dateTimeText}>📅 {appointment.date} • ⏰ {appointment.time}</Text>
      </View>
    </TouchableOpacity>
  );

  const AppointmentModal = () => (
    <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de la Cita</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedAppointment && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Cliente</Text>
                  <Text style={styles.detailText}>👤 {selectedAppointment.customerName}</Text>
                  <Text style={styles.detailText}>📧 {selectedAppointment.customerEmail}</Text>
                  <Text style={styles.detailText}>📱 {selectedAppointment.customerPhone}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Servicio</Text>
                  <Text style={styles.detailText}>✂️ {selectedAppointment.service}</Text>
                  <Text style={styles.detailText}>💰 {selectedAppointment.servicePrice}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Cita</Text>
                  <Text style={styles.detailText}>👨‍💼 {selectedAppointment.barber}</Text>
                  <Text style={styles.detailText}>📅 {selectedAppointment.date}</Text>
                  <Text style={styles.detailText}>⏰ {selectedAppointment.time}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Estado</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedAppointment.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(selectedAppointment.status)}</Text>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  {selectedAppointment.status === 'pendiente' && (
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} onPress={() => updateAppointmentStatus(selectedAppointment.id, 'confirmada')}>
                      <Text style={styles.actionButtonText}>Confirmar</Text>
                    </TouchableOpacity>
                  )}
                  {selectedAppointment.status === 'confirmada' && (
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2196F3' }]} onPress={() => updateAppointmentStatus(selectedAppointment.id, 'completada')}>
                      <Text style={styles.actionButtonText}>Marcar Completada</Text>
                    </TouchableOpacity>
                  )}
                  {selectedAppointment.status !== 'cancelada' && (
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FF9800' }]} onPress={() => updateAppointmentStatus(selectedAppointment.id, 'cancelada')}>
                      <Text style={styles.actionButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F44336' }]} onPress={() => deleteAppointment(selectedAppointment.id)}>
                    <Text style={styles.actionButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const FilterSection = () => (
    <View style={styles.filterSection}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por cliente, barbero o servicio..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterButtons}>
        {['todas', 'confirmado','cancelado'].map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterButtonText, filterStatus === status && styles.filterButtonTextActive]}>
              {status === 'todas' ? 'Todas' : getStatusText(status)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const today = new Date();
  const formattedToday = today.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).toString();
  const StatsSection = () => {
    const stats = {
      total: appointments.length,
      confirmadas: appointments.filter(a => a.status === 'confirmado').length,
      canceladas: appointments.filter(a => a.status === 'cancelado').length,
      hoy: appointments.filter(a => a.date.includes(formattedToday)).length
    };
    return (
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.confirmadas}</Text>
          <Text style={styles.statLabel}>Confirmadas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>{stats.canceladas}</Text>
          <Text style={styles.statLabel}>canceladas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#2196F3' }]}>{stats.hoy}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#333" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✂️ BARBER MOYAS</Text>
        <Text style={styles.headerSubtitle}>Gestión de Citas</Text>
      </View>
      <StatsSection />
      <FilterSection />
      <FlatList
        data={filteredAppointments}
        renderItem={({ item }) => <AppointmentItem appointment={item} />}
        keyExtractor={item => item.id.toString()}
        style={styles.appointmentsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay citas que mostrar</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || filterStatus !== 'todas' ? 'Intenta ajustar los filtros' : 'Las nuevas citas aparecerán aquí'}
            </Text>
          </View>
        }
      />
      <AppointmentModal />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#333',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 5,
  },
  statsSection: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  filterSection: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#333',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  appointmentsList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  appointmentCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  barberText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    paddingLeft: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: '48%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});


export default BarberiaApp;