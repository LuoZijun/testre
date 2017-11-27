#!/usr/bin/env python3
#coding: utf8


import re
import time

# Javascript Re
# [\\.\u3002\uFF0E\uFF61]|%2e|%2E

# Java
# https://github.com/linkedin/URL-Detector/blob/master/url-detector/src/test/java/com/linkedin/urls/detection/TestCharUtils.java#L85-L105

# 。 ． ｡  . .
# %2e | %2E  == .

CHARS  = ("\u002E", "\u3002", "\uFF0E", "\uFF61", )

PROG = re.compile(r"[\u002E\u3002\uFF0E\uFF61]|%2e|%2E", re.M)
def re_split(s, output):
    output.extend(re.split(PROG, s))

def split(s, output):
    length = len(s)
    m_length = length - 2
    bidx = 0
    cidx = 0
    while cidx < length:
        if s[cidx] in CHARS:
            output.append(s[bidx:cidx])
            cidx += 1
            bidx = cidx
        elif s[cidx] == "%" and m_length > cidx and s[cidx+1] == "2" and (s[cidx+2] == "e" or s[cidx+2] == "E"):
            output.append(s[bidx:cidx])
            cidx += 3
            bidx = cidx
        else:
            cidx += 1
    output.append(s[bidx:cidx])

def split2(s, output):
    buff = ""
    for c in s.replace("%2e", '.').replace("%2E", '.'):
        if c in CHARS:
            output.append(buff)
            buff = ""
        else:
            buff += c
    output.append(buff)


def main():
    inputs = ("abc。ef．g好%2E好吧", 
        "192.168.1.1", "..", "192%2e168%2e1%2e1", "asdf", "192.39%2e1%2E1", "as\uFF61awe.a3r23.lkajsf0ijr....",
        "%2e%2easdf", "sdoijf%2e", "ksjdfh.asdfkj.we%2", 
        "0xc0%2e0x00%2e0x02%2e0xeb", "")

    for text in inputs:
        output = []

        stime = time.time()
        split(text, output)
        etime = time.time()
        print("[  Split] Input: \"%s\" \t Output: \"%s\" \t Duration: %fs" % (text, output, etime-stime))

        output.clear()
        stime = time.time()
        split2(text, output)
        etime = time.time()
        print("[ Split2] Input: \"%s\" \t Output: \"%s\" \t Duration: %fs" % (text, output, etime-stime))

        output.clear()
        stime = time.time()
        re_split(text, output)
        etime = time.time()
        print("[ReSplit] Input: \"%s\" \t Output: \"%s\" \t Duration: %fs" % (text, output, etime-stime))
        print("")



if __name__ == '__main__':
    main()