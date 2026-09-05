namespace LokynexHealth.Application.Referrals.Queries.GetReferrals;

public class ReferralDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string Status { get; set; } = default!;
}