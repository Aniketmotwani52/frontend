export interface DashboardAppointmentDto {
    appointmentId: number;
    customerName: string;
    startTime: string;
    endTime: string;
    status: string;
    staffName: string;
}

export interface StaffPerformanceDto {
    staffId: number;
    staffName: string;
    revenueGenerated: number;
    appointmentsCompleted: number;
}

export interface DailyRevenueDto {
    date: string;
    revenue: number;
}

export interface PopularServiceDto {
    serviceId: number;
    serviceName: string;
    bookingCount: number;
}

export interface DashboardSummaryResponse {
    totalRevenue: number;
    totalAppointments: number;
    completedAppointments: number;
    pendingPaymentsAmount: number;
    upcomingAppointments: DashboardAppointmentDto[];
    staffPerformance: StaffPerformanceDto[];
    revenueTrend: DailyRevenueDto[];
    popularServices: PopularServiceDto[];
}

export interface StaffLedgerItemDto {
    appointmentId: number;
    serviceId: number;
    serviceName: string;
    serviceStatus: string;
    date: string;
    serviceValue: number;
}

export interface StaffLedgerResponse {
    staffId: number;
    staffName: string;
    servicesCompleted: number;
    totalServiceValue: number;
    services: StaffLedgerItemDto[];
}
