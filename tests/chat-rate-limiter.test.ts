import { describe, expect, it } from "vitest"
import { createClientIdentifier, InMemoryRateLimiter } from "@/lib/chat-rate-limiter"

describe("chat-rate-limiter", () => {
  it("uses forwarded header first when available", () => {
    const headers = new Headers({
      forwarded: 'for=203.0.113.10;proto=https, for="[2001:db8::5]"',
      "x-forwarded-for": "1.2.3.4",
    })

    expect(createClientIdentifier(headers)).toBe("203.0.113.10")
  })

  it("ignores malformed forwarded tokens and falls back to x-forwarded-for", () => {
    const headers = new Headers({
      forwarded: "for=unknown;proto=https",
      "x-forwarded-for": "unknown, 198.51.100.2",
    })

    expect(createClientIdentifier(headers)).toBe("198.51.100.2")
  })

  it("parses bracketed ipv6 with port", () => {
    const headers = new Headers({
      "x-forwarded-for": "[2001:db8::9]:443",
    })

    expect(createClientIdentifier(headers)).toBe("2001:db8::9")
  })

  it("parses ipv4 with port and rejects invalid ipv4", () => {
    const validHeaders = new Headers({ "x-real-ip": "203.0.113.9:3000" })
    expect(createClientIdentifier(validHeaders)).toBe("203.0.113.9")

    const invalidHeaders = new Headers({ "x-real-ip": "999.1.1.1" })
    expect(createClientIdentifier(invalidHeaders)).toBe("unknown")
  })

  it("uses hashed user-agent fallback", () => {
    const first = createClientIdentifier(new Headers({ "user-agent": "agent-1" }))
    const second = createClientIdentifier(new Headers({ "user-agent": "agent-1" }))
    const third = createClientIdentifier(new Headers({ "user-agent": "agent-2" }))

    expect(first.startsWith("ua:")).toBe(true)
    expect(first).toBe(second)
    expect(first).not.toBe(third)
  })

  it("limits forwarded list parsing to prevent oversized header abuse", () => {
    const noisyEntries = Array.from({ length: 30 }, () => "unknown")
    noisyEntries.push("198.51.100.44")

    const headers = new Headers({
      "x-forwarded-for": noisyEntries.join(","),
      "x-real-ip": "203.0.113.77",
    })

    expect(createClientIdentifier(headers)).toBe("203.0.113.77")
  })

  it("rejects out-of-bounds limiter configuration in constructor", () => {
    expect(() => new InMemoryRateLimiter(10, 20)).toThrow()
    expect(() => new InMemoryRateLimiter(60_000, 1000)).toThrow()
  })

  it("enforces max requests and resets after window", () => {
    const limiter = new InMemoryRateLimiter(1000, 2)

    expect(limiter.enforce("client", 1000).allowed).toBe(true)
    expect(limiter.enforce("client", 1200).allowed).toBe(true)

    const blocked = limiter.enforce("client", 1300)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)

    const reset = limiter.enforce("client", 2101)
    expect(reset.allowed).toBe(true)
  })

  it("clears expired entries and reports store size", () => {
    const limiter = new InMemoryRateLimiter(1000, 3)

    limiter.enforce("a", 1000)
    limiter.enforce("b", 1100)
    expect(limiter.size()).toBe(2)

    limiter.clearExpired(2101)
    expect(limiter.size()).toBe(0)
  })
})
