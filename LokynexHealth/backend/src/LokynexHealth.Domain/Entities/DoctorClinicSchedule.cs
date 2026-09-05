namespace LokynexHealth.Domain.Entities;

public class DoctorClinicSchedule : BaseEntity
{
    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = default!;
    public Guid DoctorId { get; set; }   // cross-schema reference to platform.doctors — no navigation, resolved manually

    public short DayOfWeek { get; set; }   // 0 = Sunday ... 6 = Saturday
    public int SlotMinutes { get; set; }
    public TimeOnly TimeFrom { get; set; }
    public TimeOnly TimeTo { get; set; }
    public int MaxPatients { get; set; }
    public bool IsActive { get; set; } = true;
}