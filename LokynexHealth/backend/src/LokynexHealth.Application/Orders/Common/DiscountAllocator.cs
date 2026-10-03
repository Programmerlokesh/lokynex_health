namespace LokynexHealth.Application.Orders.Common;

public static class DiscountAllocator
{
    /// <summary>
    /// Splits an order-level discount across its lines in proportion to each
    /// line's price, using the largest-remainder method on whole paise/cents.
    /// O(n log n); the allocations always sum EXACTLY to the discount, so the
    /// "Less" column and the invoice total can never disagree by a rounding paisa.
    /// </summary>
    public static decimal[] Allocate(IReadOnlyList<decimal> prices, decimal totalDiscount)
    {
        var n = prices.Count;
        var result = new decimal[n];
        if (n == 0) return result;

        var gross = prices.Sum();
        var discount = Math.Clamp(totalDiscount, 0m, gross);
        if (gross <= 0m || discount <= 0m) return result;

        var discountCents = (long)Math.Round(discount * 100m, MidpointRounding.AwayFromZero);
        var shares = new long[n];
        var remainders = new (decimal Fraction, int Index)[n];
        long assigned = 0;

        for (var i = 0; i < n; i++)
        {
            var exact = discountCents * prices[i] / gross;      // decimal math, no float drift
            var floor = (long)Math.Floor(exact);
            shares[i] = floor;
            assigned += floor;
            remainders[i] = (exact - floor, i);
        }

        var leftover = (int)(discountCents - assigned);
        foreach (var (_, index) in remainders
                     .OrderByDescending(r => r.Fraction)
                     .ThenBy(r => r.Index)
                     .Take(leftover))
        {
            shares[index]++;
        }

        for (var i = 0; i < n; i++)
            result[i] = shares[i] / 100m;

        return result;
    }
}