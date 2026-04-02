#include <linux/kernel.h>
#include <linux/string.h>
#include <linux/types.h>

#define SHA1_BLOCK_SIZE 64
#define SHA1_DIGEST_SIZE 20

typedef struct {
    u32 state[5];
    u64 bit_count;
    u8 buffer[SHA1_BLOCK_SIZE];
} sha1_context_t;

static inline u32 rol32_local(u32 value, unsigned int bits)
{
    return (value << bits) | (value >> (32 - bits));
}

static void sha1_transform(u32 state[5], const u8 buffer[SHA1_BLOCK_SIZE])
{
    u32 w[80];
    u32 a, b, c, d, e, temp;
    int i;

    for (i = 0; i < 16; ++i) {
        w[i] = ((u32)buffer[i * 4] << 24) |
               ((u32)buffer[i * 4 + 1] << 16) |
               ((u32)buffer[i * 4 + 2] << 8) |
               ((u32)buffer[i * 4 + 3]);
    }
    for (i = 16; i < 80; ++i) {
        w[i] = rol32_local(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }

    a = state[0];
    b = state[1];
    c = state[2];
    d = state[3];
    e = state[4];

    for (i = 0; i < 80; ++i) {
        u32 f;
        u32 k;
        if (i < 20) {
            f = (b & c) | ((~b) & d);
            k = 0x5A827999;
        } else if (i < 40) {
            f = b ^ c ^ d;
            k = 0x6ED9EBA1;
        } else if (i < 60) {
            f = (b & c) | (b & d) | (c & d);
            k = 0x8F1BBCDC;
        } else {
            f = b ^ c ^ d;
            k = 0xCA62C1D6;
        }

        temp = rol32_local(a, 5) + f + e + k + w[i];
        e = d;
        d = c;
        c = rol32_local(b, 30);
        b = a;
        a = temp;
    }

    state[0] += a;
    state[1] += b;
    state[2] += c;
    state[3] += d;
    state[4] += e;
}

static void sha1_init(sha1_context_t *ctx)
{
    ctx->state[0] = 0x67452301;
    ctx->state[1] = 0xEFCDAB89;
    ctx->state[2] = 0x98BADCFE;
    ctx->state[3] = 0x10325476;
    ctx->state[4] = 0xC3D2E1F0;
    ctx->bit_count = 0;
    memset(ctx->buffer, 0, sizeof(ctx->buffer));
}

static void sha1_update(sha1_context_t *ctx, const u8 *data, size_t len)
{
    size_t buffer_index = (size_t)((ctx->bit_count / 8) % SHA1_BLOCK_SIZE);
    size_t i;

    ctx->bit_count += (u64)len * 8;

    for (i = 0; i < len; ++i) {
        ctx->buffer[buffer_index++] = data[i];
        if (buffer_index == SHA1_BLOCK_SIZE) {
            sha1_transform(ctx->state, ctx->buffer);
            buffer_index = 0;
        }
    }
}

static void sha1_final(sha1_context_t *ctx, u8 digest[SHA1_DIGEST_SIZE])
{
    size_t buffer_index = (size_t)((ctx->bit_count / 8) % SHA1_BLOCK_SIZE);
    int i;

    ctx->buffer[buffer_index++] = 0x80;
    if (buffer_index > 56) {
        while (buffer_index < SHA1_BLOCK_SIZE) {
            ctx->buffer[buffer_index++] = 0;
        }
        sha1_transform(ctx->state, ctx->buffer);
        buffer_index = 0;
    }

    while (buffer_index < 56) {
        ctx->buffer[buffer_index++] = 0;
    }

    for (i = 7; i >= 0; --i) {
        ctx->buffer[buffer_index++] = (u8)(ctx->bit_count >> (i * 8));
    }

    sha1_transform(ctx->state, ctx->buffer);

    for (i = 0; i < 5; ++i) {
        digest[i * 4] = (u8)(ctx->state[i] >> 24);
        digest[i * 4 + 1] = (u8)(ctx->state[i] >> 16);
        digest[i * 4 + 2] = (u8)(ctx->state[i] >> 8);
        digest[i * 4 + 3] = (u8)(ctx->state[i]);
    }
}

void kernel_sha1_transform(const char *input, char *output, size_t size)
{
    sha1_context_t ctx;
    u8 digest[SHA1_DIGEST_SIZE];
    size_t i;

    if (size < 41) {
        if (size > 0) {
            output[0] = '\0';
        }
        return;
    }

    sha1_init(&ctx);
    sha1_update(&ctx, (const u8 *)input, strlen(input));
    sha1_final(&ctx, digest);

    for (i = 0; i < SHA1_DIGEST_SIZE; ++i) {
        snprintf(output + (i * 2), size - (i * 2), "%02x", digest[i]);
    }
    output[40] = '\0';
}
