import { prisma } from "../../lib/prisma"

export class GroupService{
    public async getGroups(){
        const groupData = await prisma.group.findMany({select:{
            id: true,
            groupName:true,
            _count:{
                select:{
                    users:true
                }
            }
        }});
        return groupData.map(group=>({
            id:group.id,
            groupName:group.groupName,
            totalUsers: group._count.users
        }));
    }
    public async createGroup(groupName:string){
        const response = await prisma.group.create({data:{groupName: groupName}});
        return response
    }
    public async getUserGroups(id:number){
        return await prisma.group.findMany({
                where: {
                    users: {
                        some: {
                            id: id
                        }
                    }
                }
            });
    }
};