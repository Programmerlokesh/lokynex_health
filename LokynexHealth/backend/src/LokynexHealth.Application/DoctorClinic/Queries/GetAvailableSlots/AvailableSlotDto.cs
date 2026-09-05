namespace LokynexHealth.Application.DoctorClinic.Queries.GetAvailableSlots;

public class AvailableSlotDto
{
    public TimeOnly TimeSlot { get; set; }
    public int MaxPatients { get; set; }
    public int BookedCount { get; set; }
    public int AvailableCount { get; set; }
    public bool IsFull => AvailableCount <= 0;
}