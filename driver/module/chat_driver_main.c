#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/device/class.h>
#include <linux/fs.h>
#include <linux/kernel.h>
#include <linux/module.h>
#include <linux/mutex.h>
#include <linux/slab.h>
#include <linux/uaccess.h>

#include "device_contract.h"

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Claude Code");
MODULE_DESCRIPTION("Socket chat processing driver");

static dev_t chat_dev;
static struct cdev chat_cdev;
static struct class *chat_class;
static struct device *chat_device;
static DEFINE_MUTEX(chat_lock);
static chat_request_t last_request;
static chat_response_t last_response;

void substitution_transform(const char *input, char *output, size_t size);
void substitution_reverse_transform(const char *input, char *output, size_t size);
void kernel_sha1_transform(const char *input, char *output, size_t size);

static int chat_open(struct inode *inode, struct file *file)
{
    (void)inode;
    (void)file;
    pr_info("chat_driver: device opened\n");
    return 0;
}

static int chat_release(struct inode *inode, struct file *file)
{
    (void)inode;
    (void)file;
    pr_info("chat_driver: device closed\n");
    return 0;
}

static ssize_t chat_read(struct file *file, char __user *buffer, size_t len, loff_t *offset)
{
    (void)file;
    if (len < sizeof(last_response)) {
        return -EINVAL;
    }
    if (*offset != 0) {
        return 0;
    }
    if (copy_to_user(buffer, &last_response, sizeof(last_response)) != 0) {
        return -EFAULT;
    }
    *offset += sizeof(last_response);
    pr_info("chat_driver: device read\n");
    return (ssize_t)sizeof(last_response);
}

static ssize_t chat_write(struct file *file, const char __user *buffer, size_t len, loff_t *offset)
{
    (void)file;
    (void)offset;
    if (len != sizeof(last_request)) {
        return -EINVAL;
    }

    mutex_lock(&chat_lock);
    memset(&last_request, 0, sizeof(last_request));
    memset(&last_response, 0, sizeof(last_response));

    if (copy_from_user(&last_request, buffer, sizeof(last_request)) != 0) {
        mutex_unlock(&chat_lock);
        return -EFAULT;
    }

    last_response.message_id = last_request.message_id;
    last_response.response_type = RESPONSE_ACK;
    last_response.status = STATUS_OK;
    snprintf(last_response.from_username, sizeof(last_response.from_username), "%s", last_request.username);
    snprintf(last_response.peer_username, sizeof(last_response.peer_username), "%s", last_request.peer_username);

    if (last_request.mode == CHAT_PROC_SHA1) {
        kernel_sha1_transform(last_request.auth_payload[0] != '\0' ? last_request.auth_payload : last_request.payload,
                              last_response.payload, sizeof(last_response.payload));
        pr_info("chat_driver: sha1 request processed\n");
    } else if (last_request.mode == CHAT_PROC_SUBSTITUTION) {
        substitution_transform(last_request.payload, last_response.payload, sizeof(last_response.payload));
        pr_info("chat_driver: substitution request processed\n");
    } else if (last_request.mode == CHAT_PROC_SUBSTITUTION_DECRYPT) {
        substitution_reverse_transform(last_request.payload, last_response.payload, sizeof(last_response.payload));
        pr_info("chat_driver: substitution decrypt request processed\n");
    } else {
        last_response.status = STATUS_INVALID_REQUEST;
        snprintf(last_response.payload, sizeof(last_response.payload), "%s", "unsupported-mode");
    }

    mutex_unlock(&chat_lock);
    pr_info("chat_driver: device written\n");
    return (ssize_t)sizeof(last_request);
}

static char *chat_devnode(const struct device *dev, umode_t *mode)
{
    (void)dev;
    if (mode != NULL) {
        *mode = 0666;
    }
    return NULL;
}

static const struct file_operations chat_fops = {
    .owner = THIS_MODULE,
    .open = chat_open,
    .read = chat_read,
    .write = chat_write,
    .release = chat_release,
};

static int __init chat_driver_init(void)
{
    int result;

    result = alloc_chrdev_region(&chat_dev, 0, 1, CHAT_DEVICE_NAME);
    if (result < 0) {
        return result;
    }

    cdev_init(&chat_cdev, &chat_fops);
    chat_cdev.owner = THIS_MODULE;

    result = cdev_add(&chat_cdev, chat_dev, 1);
    if (result < 0) {
        unregister_chrdev_region(chat_dev, 1);
        return result;
    }

    chat_class = class_create(CHAT_CLASS_NAME);
    if (IS_ERR(chat_class)) {
        cdev_del(&chat_cdev);
        unregister_chrdev_region(chat_dev, 1);
        return PTR_ERR(chat_class);
    }

    chat_class->devnode = chat_devnode;

    chat_device = device_create(chat_class, NULL, chat_dev, NULL, CHAT_DEVICE_NAME);
    if (IS_ERR(chat_device)) {
        class_destroy(chat_class);
        cdev_del(&chat_cdev);
        unregister_chrdev_region(chat_dev, 1);
        return PTR_ERR(chat_device);
    }

    mutex_init(&chat_lock);
    pr_info("chat_driver: module loaded\n");
    return 0;
}

static void __exit chat_driver_exit(void)
{
    device_destroy(chat_class, chat_dev);
    class_destroy(chat_class);
    cdev_del(&chat_cdev);
    unregister_chrdev_region(chat_dev, 1);
    pr_info("chat_driver: module unloaded\n");
}

module_init(chat_driver_init);
module_exit(chat_driver_exit);
