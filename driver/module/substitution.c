#include <linux/types.h>

static const char k_lower_alphabet[] = "abcdefghijklmnopqrstuvwxyz";
static const char k_lower_cipher[] = "qazwsxedcrfvtgbyhnujmikolp";
static const char k_upper_alphabet[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
static const char k_upper_cipher[] = "QAZWSXEDCRFVTGBYHNUJMIKOLP";
static const char k_digits[] = "0123456789";
static const char k_digit_cipher[] = "7319058246";

static char map_char(char ch, const char *source, const char *target, int count)
{
    int i;

    for (i = 0; i < count; ++i) {
        if (source[i] == ch) {
            return target[i];
        }
    }
    return ch;
}

static char map_forward(char ch)
{
    if (ch >= 'a' && ch <= 'z') {
        return map_char(ch, k_lower_alphabet, k_lower_cipher, 26);
    }
    if (ch >= 'A' && ch <= 'Z') {
        return map_char(ch, k_upper_alphabet, k_upper_cipher, 26);
    }
    if (ch >= '0' && ch <= '9') {
        return map_char(ch, k_digits, k_digit_cipher, 10);
    }
    return ch;
}

static char map_reverse(char ch)
{
    if (ch >= 'a' && ch <= 'z') {
        return map_char(ch, k_lower_cipher, k_lower_alphabet, 26);
    }
    if (ch >= 'A' && ch <= 'Z') {
        return map_char(ch, k_upper_cipher, k_upper_alphabet, 26);
    }
    if (ch >= '0' && ch <= '9') {
        return map_char(ch, k_digit_cipher, k_digits, 10);
    }
    return ch;
}

void substitution_transform(const char *input, char *output, size_t size)
{
    size_t i;

    if (size == 0) {
        return;
    }

    for (i = 0; input[i] != '\0' && i + 1 < size; ++i) {
        output[i] = map_forward(input[i]);
    }
    output[i] = '\0';
}

void substitution_reverse_transform(const char *input, char *output, size_t size)
{
    size_t i;

    if (size == 0) {
        return;
    }

    for (i = 0; input[i] != '\0' && i + 1 < size; ++i) {
        output[i] = map_reverse(input[i]);
    }
    output[i] = '\0';
}
