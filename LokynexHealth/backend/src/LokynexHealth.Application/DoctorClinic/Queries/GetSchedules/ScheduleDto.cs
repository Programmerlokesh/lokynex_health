namespace LokynexHealth.Application.DoctorClinic.Queries.GetSchedules;

public class ScheduleDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = default!;
    public Guid DoctorId { get; set; }
    public short DayOfWeek { get; set; }
    public int SlotMinutes { get; set; }
    public TimeOnly TimeFrom { get; set; }
    public TimeOnly TimeTo { get; set; }
    public int MaxPatients { get; set; }
    public bool IsActive { get; set; }
}