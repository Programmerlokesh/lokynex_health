namespace LokynexHealth.Application.Technicians.Queries.GetTechnicians;

public class TechnicianDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string Status { get; set; } = default!;
}